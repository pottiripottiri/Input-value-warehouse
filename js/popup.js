$(function () {

  $("#back-button").hide();
  $("#save-area").hide();
  $("#guide-save-operation").hide();

  let data_all = {};
  let data_hash = {};
  let data_array = [];
  let tab_id;
  let tab_url;

  /**
   * 現在タブ
   */
  const current_tab = async function () {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
  }

  /**
   * リセット
   */
  const reset = function () {

    chrome.storage.local.get(["default", "meta"], function (result) {

      data_all = {};
      meta_all = {};
      data_hash = {};
      data_array = [];

      const autocomplete_element = $("#save-title-dropdown");
      autocomplete_element.empty();
      const select_element = $("#select-load-title");
      select_element.empty();

      if (typeof result.default === "undefined") {
        $("#select-load-title").prop("disabled", true);
        $("#load-button").prop("disabled", true);
        $("#message-no-title").show();
        return;
      }

      data_all = typeof result.default === "undefined" ? [] : result.default;
      meta_all = typeof result.meta === "undefined" ? [] : result.meta;

      chrome.tabs.query({ active: true, currentWindow: true }, (t) => {

        const url = t[0].url;
        if (!data_all[url]) {
          return;
        }

        data_hash = data_all[url];
        for (let [key, value] of Object.entries(data_hash)) {
          data_array.push({ title: key, updated: value.updated, data: value });
        }

        data_array.sort(function (a, b) {
          if (a.updated > b.updated) return -1;
          if (a.updated < b.updated) return 1;
          return 0;
        });

        data_array.forEach(r => {
          autocomplete_element.append($('<option>').html("<a href=\"#\">" + r.title + "</a>").addClass("autocomplete").data("autocomplete", r.title).data("target", "save_title"));
          select_element.append($('<option>').html(r.title).val(r.title));
        });

        if (data_array.lentgh <= 0) {
          $("#select-load-title").prop("disabled", true);
          $("#load-button").prop("disabled", true);
          $("#message-no-title").show();
        } else {
          $("#select-load-title").prop("disabled", false);
          $("#load-button").prop("disabled", false);
          $("#message-no-title").hide();
        }

      });

    });

  }

  /**
   * 保存
   */
  const save = function () {

    chrome.scripting.executeScript({
      target: { tabId: tab_id },
      function: function () {

        // 入力内容の収集      
        let num_hash = {};

        const types = ["text", "search", "tel", "url", "email", "datetime", "date", "month", "week", "time", "datetime-local", "number", "range", "color", "radio", "checkbox"];
        let targets = [];
        $("input:enabled:visible").each(function () {
          targets.push({ "element": $(this), "tag": "input" });
        });
        $("select:enabled:visible").each(function () {
          targets.push({ "element": $(this), "tag": "select" });
        });
        $("textarea:enabled:visible").each(function () {
          targets.push({ "element": $(this), "tag": "textarea" });
        });

        let values = [];
        const mode_select = $("body").hasClass("ivm-mode-select");
        targets.forEach(function (target) {

          if (values.length >= 200) {
            return false;
          }

          let e = target.element;
          if (mode_select && !$(e).hasClass("ivw-selected-form")) {
            return true;
          }

          let type = "";
          if ($(e).attr("type")) {
            type = $(e).attr("type");
          }

          if (target.tag == "input" && !types.includes(type)) {
            return true;
          }

          let key = target.tag + "-";
          if (type != "") {
            key += type + "-";
          }

          if ($(e).attr("id") && $(e).attr("id").length > 0) {
            key += "#" + $(e).attr("id");
          } else if ($(e).attr("name") && $(e).attr("name").length > 0) {
            key += "[name=\"" + $(e).attr("name") + "\"]";
          }

          if (typeof num_hash[key] === "undefined") {
            num_hash[key] = 0;
          } else {
            num_hash[key]++;
          }

          let checked = false;
          if (type == "radio" || type == "checkbox") {
            if ($(e).prop("checked")) {
              checked = true;
            }
          }

          let label = "";
          if ($(e).attr("id") && $(e).attr("id").length > 0) {
            if ($("label[for=\"" + $(e).attr("id") + "\"]").length) {
              label = $("label[for=\"" + $(e).attr("id") + "\"]").text().trim().replace(/\r?\n/g, "");
            }
          }

          let val = $(e).val();
          if (type == "radio" || type == "checkbox") {
            if (!$(e).attr("value")) {
              val = "";
            }
          }

          values.push({
            "tag": target.tag,
            "type": type,
            "id": $(e).attr("id"),
            "name": $(e).attr("name"),
            "value": val,
            "num": num_hash[key],
            "checked": checked,
            "label": label,
          });

        });

        // ページのメタ情報
        meta = {};
        meta['title'] = $("head > title").text();

        return { url: location.href, values: values, meta: meta };

      }
    }, function (response) {

      if (!data_all[response[0].result.url]) {
        data_all[response[0].result.url] = {};
      }

      meta_all[response[0].result.url] = response[0].result.meta;

      data_all[response[0].result.url][$("#save-title").val()] = {
        updated: new Date().getTime(),
        values: response[0].result.values
      };

      chrome.storage.local.set({ default: data_all, meta: meta_all }, function () {
        chrome.scripting.executeScript({
          target: { tabId: tab_id },
          files: ["/js/select_off.js"]
        });
        $("#save-area").hide('slow');
        $("#back-button").hide("slow");
        $("#mode-select-button").show("slow");
        $("#mode-all-button").show("slow");
        $("#guide-save-operation").hide();
        $("#selected-count").hide();

        const alert_element = ivwCreateAlert(chrome.i18n.getMessage("popup_message_complete_save")).addClass("alert-success");
        $("#alert-area").append(alert_element);
        setTimeout(() => {
          alert_element.alert('close');
        }, 5000);

        reset();

      });

    });

  };

  // イベント：閉じる
  $(document).on('ontouched click', '.close', function () {
    window.close();
  });

  // イベント：オートコンプリート
  $(document).on('ontouched click', '.autocomplete', function () {
    var text = $(this).data('autocomplete');
    var target = $(this).data('target');
    $('input[name="' + target + '"]').val(text);
  });

  // イベント：保存
  $("#save-button").on("click", function () {
    if (data_hash[$("#save-title").val()]) {
      $("#overwrite-confirm-modal").modal("show");
      return false;
    }
    save();
    return false;
  });

  // イベント：上書き保存
  $("#overwrite-button").on("click", function () {
    $("#overwrite-confirm-modal").modal("hide");
    save();
    return false;
  });

  // イベント：展開
  $("#load-button").on("click", function () {

    let selected = $("#select-load-title").val();
    chrome.storage.local.set({ selected_data: data_hash[selected] },
      chrome.scripting.executeScript({
        target: { tabId: tab_id },
        function: function () {
          chrome.storage.local.get(["selected_data"], function (result) {
            result.selected_data.values.forEach(function (value) {

              let key = value.tag;
              if (value.type && value.type.length) {
                key += "[type=\"" + value.type + "\"]";
              }
              if (value.id && value.id.length) {
                key += "#" + value.id;
              }
              if (value.name && value.name.length) {
                key += "[name=\"" + value.name + "\"]";
              }

              let e = $(key).get(value.num);
              if (value.type && (value.type == "checkbox" || value.type == "radio")) {
                if (value.value && value.value.length) {
                  key += "[value=\"" + value.value + "\"]";
                  e = $(key);
                } else {
                  e = $(key).get(value.num);
                }
              } else {
                e = $(key).get(value.num);
              }

              if ($(e).length <= 0) {
                return false;
              }

              if (value.type && (value.type == "checkbox" || value.type == "radio")) {
                $(e).prop("checked", (value.checked || value.checked == "true") ? true : false);
                $("<span class=\"ivw-applied-mark\">&hearts;</span>").insertAfter(e);
              } else {
                $(e).val(value.value);
                $(e).addClass("ivw-applied-form");
              }

            });

            setTimeout(() => {
              $(".ivw-applied-form").removeClass("ivw-applied-form");
              $(".ivw-applied-mark").remove();
            }, 5000);

          })
        }
      }, function () {
        const alert_element = ivwCreateAlert(chrome.i18n.getMessage("popup_message_complete_load")).addClass("alert-success");
        $("#alert-area").append(alert_element);
        setTimeout(() => {
          alert_element.alert('close');
        }, 5000);

        reset();
        $("#select-load-title").val(selected);

      }));

    return false;

  });

  // イベント：選択したフォームから
  $("#mode-select-button").on("click", function () {
    $("#save-area").show("slow");
    $(this).hide("slow");
    $("#mode-all-button").hide("slow");
    $("#back-button").text(chrome.i18n.getMessage("popup_back_clear_select_mode_button")).show("slow");
    $("#guide-save-operation small").html(chrome.i18n.getMessage("popup_guide_select_mode"));
    $("#guide-save-operation").show("slow");
    $("#selected-count").show();
    $("#selected-count small").text(chrome.i18n.getMessage("popup_selected_count", [0]));
    chrome.scripting.executeScript({
      target: { tabId: tab_id },
      files: ["/js/select_on.js"]
    });
    return false;
  });

  // イベント：全てのフォームから
  $("#mode-all-button").on("click", function () {
    $("#save-area").show("slow");
    $(this).hide("slow");
    $("#mode-select-button").hide("slow");
    $("#back-button").text(chrome.i18n.getMessage("popup_back_to_select_button")).show("slow");
    $("#guide-save-operation small").html(chrome.i18n.getMessage("popup_guide_all_mode"));
    $("#guide-save-operation").show("slow");
    chrome.scripting.executeScript({
      target: { tabId: tab_id },
      files: ["/js/select_off.js"]
    });
    return false;
  });

  // イベント：選択モードクリア
  $("#back-button").on("click", function () {
    $("#save-area").hide('slow');
    $(this).hide("slow");
    $("#mode-select-button").show("slow");
    $("#mode-all-button").show("slow");
    $("#guide-save-operation").hide();
    $("#selected-count").hide();
    chrome.scripting.executeScript({
      target: { tabId: tab_id },
      files: ["/js/select_off.js"]
    });
    return false;
  });

  // イベント：オプションページリンク
  // イベント：選択モードクリア
  $(document).on("click", "#link-option-page", function () {
    chrome.runtime.openOptionsPage();
    return false;
  });

  // 初期設定
  current_tab().then(function (tab) {

    tab_id = tab.id;
    tab_url = tab.url;

    chrome.scripting.insertCSS({
      target: { tabId: tab_id },
      files: ["/css/select.css"]
    });
    chrome.scripting.insertCSS({
      target: { tabId: tab_id },
      files: ["/css/apply.css"]
    });
    chrome.scripting.executeScript({
      target: { tabId: tab_id },
      files: ["/vendor/jquery-3.6.0/jquery-3.6.0.min.js"],
    });
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab_id },
        files: ["/js/form.js"]
      });
    }, 100);
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab_id },
        function: function () {
          // 選択モードかどうか
          return { "mode_select": $("body").hasClass("ivm-mode-select"), "selected_count": $(".ivw-selected-form").length };
        },
      }, function (response) {

        reset();

        if (response[0].result && response[0].result.mode_select == true) {

          $("#save-area").show();
          $("#mode-select-button").hide();
          $("#mode-all-button").hide();
          $("#back-button").text(chrome.i18n.getMessage("popup_back_clear_select_mode_button")).show();
          $("#guide-save-operation small").html(chrome.i18n.getMessage("popup_guide_select_mode"));
          $("#guide-save-operation").show();
          $("#selected-count").show();
          $("#selected-count small").text(chrome.i18n.getMessage("popup_selected_count", [response[0].result.selected_count]));
        }

      });
    }, 200);

  });
});

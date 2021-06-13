$(function () {

  let url_hash = {};
  let url_array = [];

  const element_select_saved_url = $("#select-saved-url");
  const element_select_saved_title = $("#select-saved-title");
  const element_table_values = $("#table-values");
  const element_button_save_values = $("#button-save-values");
  
  /**
   * URLリストロード
   */
  const url_load = function() {

    chrome.storage.local.get(["default"], function(result) {

      url_hash = {};
      url_array = [];

      element_select_saved_url.empty();
      element_select_saved_title.empty();
      
      element_select_saved_url.prop("disabled", true);
      element_select_saved_title.prop("disabled", true);
      element_table_values.find("tbody").empty();
      element_button_save_values.prop("disabled", true);

      if (typeof result.default === "undefined") {
        return;
      }

      url_hash = result.default;
      for (let [key, value] of Object.entries(url_hash)) {
        url_array.push({url: key, data: value});
      }

      url_array.sort(function(a, b){
        if (a.url < b.url) return -1;
        if (a.url > b.url) return 1;
        return 0;
      });

      url_array.forEach(a => {
        element_select_saved_url.append($('<option>').html(a.url).val(a.url));
      });

      if (url_array.length > 0) {
        element_select_saved_url.prop("disabled", false);
        title_load(url_array[0].url);
      }
      
    });

  }
   
  let title_hash = {};
  let title_array = {};

  /**
   * タイトルリストロード
   */
  const title_load = function(url) {

    title_hash = {};
    title_array = [];

    element_select_saved_title.empty();
    element_select_saved_title.prop("disabled", true);
    element_table_values.find("tbody").empty();
    element_button_save_values.prop("disabled", true);

    if (!url_hash[url]) {
      return;
    }

    title_hash = url_hash[url];
    for (let [key, value] of Object.entries(title_hash)) {
      title_array.push({title: key, updated: value.updated, values: value.values});
    }

    title_array.sort(function(a, b){
      if (a.updated > b.updated) return -1;
      if (a.updated < b.updated) return 1;
      return 0;
    });

    title_array.forEach(a => {
      element_select_saved_title.append($('<option>').html(a.title).val(a.title));
    });

    if (title_array.length > 0) {
      element_select_saved_title.prop("disabled", false);
      values_load(title_array[0].title);
    }

  }

  let values_array = {};

  /**
   * 入力値リストロード
   */
  const row_html = function(row) {

    let row_html = "";
    row_html += "<tr>";
    row_html += "  <td class=\"text-center\">";
    row_html += "    <input type=\"checkbox\" class=\"ivw-row-checkbox-delete\">";
    row_html += "  </td>"  
    row_html += "  <td>";
    row_html += "    <input type=\"text\" class=\"form-control form-control-sm ivw-row-id\" size=\"5\" disabled>";
    row_html += "    <input type=\"hidden\" class=\"ivw-row-tag\">";
    row_html += "    <input type=\"hidden\" class=\"ivw-row-type\">";
    row_html += "    <input type=\"hidden\" class=\"ivw-row-idx\">";
    if (row.type != "radio" && row.type != "checkbox") {
      row_html += "    <input type=\"hidden\" class=\"ivw-row-checked\">";
    }

    row_html += "  </td>";
    row_html += "  <td>";
    row_html += "    <input type=\"text\" class=\"form-control form-control-sm ivw-row-num\" size=\"1\" disabled>";
    row_html += "  </td>";
    row_html += "  <td>";
    row_html += "    <input type=\"text\" class=\"form-control form-control-sm ivw-row-name\" size=\"5\" disabled>";
    row_html += "  </td>";
    row_html += "  <td>";
    row_html += "    <input type=\"text\" class=\"form-control form-control-sm ivw-row-label\" size=\"5\" disabled>";
    row_html += "  </td>";    
    row_html += "  <td>";
    if (row.type == "radio" || row.type == "checkbox") {
      row_html += "    <input type=\"text\" class=\"form-control form-control-sm ivw-row-value\" size=\"5\" disabled>";
    } else {
      row_html += "    <input type=\"text\" class=\"form-control form-control-sm\" size=\"5\" disabled>";
    }
    row_html += "  </td>";
    row_html += "  <td>";
    if (row.tag == "textarea") {
      row_html += "    <textarea class=\"form-control form-control-sm ivw-row-value\" size=\"5\"></textarea>";
    } else if (row.type == "radio" || row.type == "checkbox") {
      row_html += "    <select class=\"form-control form-control-sm ivw-row-checked\">";
      row_html += "      <option value=\"false\">" + chrome.i18n.getMessage("options_label_check_off") + "</option>";
      row_html += "      <option value=\"true\">" + chrome.i18n.getMessage("options_label_check_on") + "</option>";
      row_html += "    </select>";
    } else {
      row_html += "    <input type=\"text\" class=\"form-control form-control-sm ivw-row-value\" size=\"5\">";
    }
    row_html += "  </td>";
    row_html += "</tr>";  
  
    return row_html;

  }

  /**
   * 入力値リストロード
   */
  const values_load = function(title) {

    values_array = [];

    element_table_values.find("tbody").empty();
    element_button_save_values.prop("disabled", true);
    
    if (!title_hash[title]) {
      return;
    }

    values_array = title_hash[title].values;
    values_array.forEach(function(val, idx) {
      let row = $(row_html(val));
      row.find(".ivw-row-id").val(val.id);
      row.find(".ivw-row-idx").val(idx);
      row.find(".ivw-row-num").val(val.num);
      row.find(".ivw-row-tag").val(val.tag);
      row.find(".ivw-row-type").val(val.type);
      row.find(".ivw-row-label").val(val.label);
      row.find(".ivw-row-name").val(val.name);
      row.find(".ivw-row-value").val(val.value);
      row.find(".ivw-row-checked").val(val.checked.toString());

      element_table_values.find("tbody").append(row);
    });

    if (values_array.length > 0) {
      element_button_save_values.prop("disabled", false);
    }

  }

  // イベント：URL選択
  element_select_saved_url.on("change", function() {
    title_load($(this).val());
  });

  // イベント：タイトル選択
  element_select_saved_title.on("change", function() {
    values_load($(this).val());
  });

  // イベント：削除チェック
  $(document).on("change", ".ivw-row-checkbox-delete", function() {
    let tr = $(this).closest("tr");
    if ($(this).prop("checked")) {
      tr.addClass("table-dark");
      tr.find(".ivw-row-value").prop("disabled", true);
    } else {
      tr.removeClass("table-dark");
      tr.find(".ivw-row-value").prop("disabled", false);
    }

  });

  // イベント：URL削除
  $("#delete-url").on("click", function() {

    let url = element_select_saved_url.val();

    delete url_hash[url];

    chrome.storage.local.set({default: url_hash}, function() {

      url_load();

      const alert_element = ivwCreateAlert(chrome.i18n.getMessage("options_message_complete_delete")).addClass("alert-success");
      $("#alert-area").append(alert_element);
      setTimeout(() => {
        alert_element.alert('close');
      }, 5000);

    });

    return false;

  });

  // イベント：タイトル削除
  $("#delete-title").on("click", function() {

    let url = element_select_saved_url.val();
    let title = element_select_saved_title.val();

    delete url_hash[url][title];

    chrome.storage.local.set({default: url_hash}, function() {

      title_load(url);

      const alert_element = ivwCreateAlert(chrome.i18n.getMessage("options_message_complete_delete")).addClass("alert-success");
      $("#alert-area").append(alert_element);
      setTimeout(() => {
        alert_element.alert('close');
      }, 5000);

    });

    return false;

  });

  // イベント：保存
  element_button_save_values.on("click", function() {

    let url = element_select_saved_url.val();
    let title = element_select_saved_title.val();

    let values = [];
    element_table_values.find("tbody > tr").each(function() {

      let tr = $(this);
      if (!$(tr).find(".ivw-row-checkbox-delete").prop("checked")) {
        values.push({
          "tag" : $(tr).find(".ivw-row-tag").val(),
          "type": $(tr).find(".ivw-row-type").val(),
          "id": $(tr).find(".ivw-row-id").val(),
          "num": $(tr).find(".ivw-row-num").val(),
          "name": $(tr).find(".ivw-row-name").val(),
          "value" : $(tr).find(".ivw-row-value").val(),
          "checked" : $(tr).find(".ivw-row-checked").val(),
          "label" : $(tr).find(".ivw-row-label").val()
        });  
      }
      
    });

    url_hash[url][title] = {
      updated: new Date().toTimeString(),
      values: values
    };

    chrome.storage.local.set({default: url_hash}, function() {

      values_load(title);

      const alert_element = ivwCreateAlert(chrome.i18n.getMessage("options_message_complete_save")).addClass("alert-success");
      $("#alert-area").append(alert_element);
      setTimeout(() => {
        alert_element.alert('close');
      }, 5000);

    });

    return false;

  });

  url_load();
  
});
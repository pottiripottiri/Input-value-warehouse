$(function() {

  // i18n
  $("[data-i18n]").each(function() {
    let key = $(this).attr("data-i18n");
    $(this).html(chrome.i18n.getMessage(key));
  });

});

/**
 * アラート要素を生成する
 */
function ivwCreateAlert(msg) {
  return $('<div class="alert" role="alert"></div>').html(msg);
};

/**
 * アラート要素を生成する（エラー）
 */
function ivwCreateError (msg) {
  return ivwCreateAlert(msg).addClass("alert-danger");
};

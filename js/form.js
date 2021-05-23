$(function() {
  if (!$("body").hasClass("ivm-ready")) {
    $("body").addClass("ivm-ready");
    $(document).on("click.ivw_select_mode", "body.ivm-mode-select input,select,textarea", function() {
      let type = $(this).attr("type");
      if (["text", "search", "tel", "url", "email", "datetime", "date", "month", "week", "time", "datetime-local", "number", "range", "color"].includes(type)) {
        $(this).addClass("ivw-selected-form");
      } else if (["radio", "checkbox"].includes(type)) {
        if (!$(this).hasClass("ivw-selected-form")) {
          $("<span class=\"ivw-selected-mark\">&hearts;</span>").insertAfter(this);
        }        
        $(this).addClass("ivw-selected-form");
      }
    });
    $(document).on("click.ivw_select_mode", "body.ivm-mode-select select,textarea", function() {
      $(this).addClass("ivw-selected-form");
    });
  }
});

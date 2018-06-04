jQuery(document).ready(function() {
  var search = location.search.substring(1);
  var obj = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
  jQuery('input[name=email]').val(obj.email);
  var lists = (obj.lists || '').split(',');
  for(var i = 0; i < lists.length; i++) {
    jQuery('input[value="' + lists[i] + '"]').prop("checked", true);
  }
});

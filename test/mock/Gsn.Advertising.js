window.Gsn = {
  Advertising: {
    listeners: {},
    on: function(event, func) {
      window.Gsn.Advertising.listeners[event] = func;
    },
    trigger: function(event, data) {
      var func = window.Gsn.Advertising.listeners[event];
      if (func) {
        func(data);
      }
    }
  }
};

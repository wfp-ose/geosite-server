var init_start = function(appName)
{
  init_main_app(appName);
};

var init_main_app = function(appName)
{
  geositeApp = app = angular.module(appName, ['ngRoute']);

  app.factory('state', function(){return $.extend({}, geosite["state"]);});
  app.factory('stateschema', function(){return $.extend({}, geosite["stateschema"]);});
  app.factory('map_config', function(){return $.extend({}, map_config);});
  app.factory('live', function(){
    return {
      "map": undefined,
      "baselayers": {},
      "featurelayers": {
        "popatrisk":undefined
      }
    };
  });

  /*
  init_sparc_controller_main will kick off a recursive search for controllers
  to add to the angular app/module.  However, the initialization code in
  app.controller(...function(){XXXXX}) won't actually execute until
  angular.bootstrap is called.  Therefore, each controller should Initialize
  in a breadth-first sequential order.

  If you miss a component with ng-controller, bootstrap will attempt
  to load it on its own within angular.bootstrap.  That'll error out
  and is not good.  So you NEED!!! to get to it first!!!!!!
  */

  geosite.init_controller_base(app);

  init_sparc_controller_main($('.geosite-controller.geosite-main'), app);

  angular.bootstrap(document, [appName]);
};

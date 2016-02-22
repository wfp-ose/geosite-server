var init_start = function(appName)
{
  init_main_app(appName);
};

var init_main_app = function(appName)
{
  geosite.app = app = angular.module(appName, ['ngRoute']);

  app.factory('state', function(){return $.extend({}, geosite.initial_data["state"]);});
  app.factory('stateschema', function(){return $.extend({}, geosite.initial_data["stateschema"]);});
  app.factory('map_config', function(){return $.extend({}, map_config);});
  app.factory('live', function(){
    return {
      "map": undefined,
      "baselayers": {},
      "featurelayers": {}
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

var init_sparc_controller = function(that, app)
{
  var controllerName = that.data('controllerName');
  var controllerType = that.data('controllerType');

  app.controller(controllerName, function($scope, $element) {

    init_intents($($element), $scope);

  });
};

geosite.controller_main = function($scope, $element, $controller, state, stateschema, live)
{

    $scope.state = geosite.init_state(state, stateschema);
    $scope.live = live;

    // Calendar, Country, Hazard, or Filter Changed
    $scope.$on("stateChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state = $.extend($scope.state, args);
            var url = buildPageURL($scope.state.page, $scope.state);
            history.replaceState(state, "", url);
            // Refresh Map
            $scope.$broadcast("refreshMap", {'state': $scope.state});
        });
    });

    // Map Panned or Zoomed
    $scope.$on("filterChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state.filters[args["layer"]] = $.extend(
              $scope.state.filters[args["layer"]],
              args["filter"]);
            var url = buildPageURL($scope.state.page, $scope.state);
            history.replaceState(state, "", url);
            // Refresh Map
            $scope.$broadcast("refreshMap", {'state': $scope.state});
        });
    });

    // Map Panned or Zoomed
    $scope.$on("viewChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.state.view = $.extend($scope.state.view, args);
        var url = buildPageURL($scope.state.page, $scope.state);
        history.replaceState(state, "", url);
        // $scope.$on already wraps $scope.$apply
        /*$scope.$apply(function () {
            $scope.state.view = $.extend($scope.state.view, args);
            var url = buildPageURL("countryhazardmonth_detail", state);
            history.replaceState(state, "", url);
        });*/
    });

    $scope.$on("layerLoaded", function(event, args) {
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        $scope.state.view.featurelayers.push(layer);
    });

    $scope.$on("showLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        if($.inArray(layer, $scope.state.view.featurelayers) == -1)
        {
          $scope.state.view.featurelayers.push(layer);
          // Refresh Map
          $scope.$broadcast("refreshMap", {'state': $scope.state});
        }
    });
    $scope.$on("hideLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        var i = $.inArray(layer, $scope.state.view.featurelayers);
        if(i != -1)
        {
          $scope.state.view.featurelayers.splice(i, 1);
          // Refresh Map
          $scope.$broadcast("refreshMap", {'state': $scope.state});
        }
    });
    $scope.$on("switchBaseLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        $scope.state.view.baselayer = args.layer;
        // Refresh Map
        $scope.$broadcast("refreshMap", {'state': $scope.state});
    });

    $scope.$on("zoomToLayer", function(event, args) {
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        var i = $.inArray(layer, $scope.state.view.featurelayers);
        if(i != -1)
        {
          $scope.$broadcast("changeView", {'layer': layer});
        }
    });
};


var init_sparc_controller_main = function(that, app)
{
  geosite.init_controller(that, app, geosite.controller_main);

  $('.geosite-controller.geosite-sidebar', that).each(function(){
    geosite.init_controller($(this), app, geosite.controller_sidebar);
  });

  $('.geosite-controller.geosite-map', that).each(function(){
    // Init This
    geosite.init_controller($(this), app, geosite.controller_map);
    // Init Children
    geosite.init_controllers($(this), app, [
      { "selector": ".geosite-controller.geosite-map-map", "controller": geosite.controller_map_map },
      { "selector": ".geosite-controller.geosite-map-legend", "controller": undefined }
    ]);
  });
};

geosite.controller_map = function($scope, $element, $controller, state, map_config) {

};

var init_map = function(opts)
{
  var map = L.map('map',
  {
    zoomControl: opt_b(opts, "zoomControl", false),
    minZoom: opt_i(opts, "minZoom", 3),
    maxZoom: opt_i(opts, "maxZoom", 18)
  });
  map.setView(
    [opt_i(opts,["latitude", "lat"],0), opt_i(opts,["longitude", "lon", "lng", "long"], 0)],
    opt_i(opts, ["zoom", "z"], 0));

  $.each(opt_j(opts, "listeners"), function(e, f){
    map.on(e, f);
  });

  return map;
};

var init_baselayers = function(map, baselayers)
{
  var layers = {};
  for(var i = 0; i < baselayers.length; i++)
  {
      var tl = baselayers[i];
      try{
        layers[tl.id] = L.tileLayer(tl.source.url, {
            id: tl.id,
            attribution: tl.source.attribution
        });
      }catch(err){console.log("Could not add baselayer "+i);}
  }
  return layers;
};

geosite.controller_map_map = function($scope, $element, $interpolate, state, map_config, live) {
  //////////////////////////////////////
  var listeners =
  {
    zoomend: function(e){
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "z": live["map"].getZoom()
      };
      geosite.intend("viewChanged", delta, $scope);
    },
    dragend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("viewChanged", delta, $scope);
    },
    moveend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.intend("viewChanged", delta, $scope);
    }
  };
  //////////////////////////////////////
  // The Map
  var hasViewOverride = hasHashValue(["latitude", "lat", "longitude", "lon", "lng", "zoom", "z"]);
  var view = state["view"];
  live["map"] = init_map({
    "zoomControl": map_config["controls"]["zoom"],
    "minZoom": map_config["view"]["minZoom"],
    "maxZoom": map_config["view"]["maxZoom"],
    "lat": view["lat"],
    "lon": view["lon"],
    "z": view["z"],
    "listeners": listeners
  });
  //////////////////////////////////////
  // Base Layers
  var baseLayers = init_baselayers(live["map"], map_config["baselayers"]);
  $.extend(live["baselayers"], baseLayers);
  var baseLayerID = map_config["baselayers"][0].id;
  live["baselayers"][baseLayerID].addTo(live["map"]);
  geosite.intend("viewChanged", {'baselayer': baseLayerID}, $scope);
  geosite.intend("layerLoaded", {'layer': baseLayerID}, $scope);
  //////////////////////////////////////
  // Feature layers
  // Load Population at Risk
  $.each(map_config.featurelayers, function(id, layerConfig){
    if(layerConfig.enabled == undefined || layerConfig.enabled == true)
    {
      if(layerConfig.type.toLowerCase() == "wms")
      {
        //https://github.com/Leaflet/Leaflet/blob/master/src/layer/tile/TileLayer.WMS.js
        var w = layerConfig.wms;
        var fl = L.tileLayer.wms(w.url, {
          renderOrder: $.inArray(id, map_config.renderlayers),
          buffer: w.buffer || 0,
          version: w.version || "1.1.1",
          layers: w.layers.join(","),
          styles: w.styles ? w.styles.join(",") : '',
          format: w.format,
          transparent: w.transparent || false,
          attribution: layerConfig.source
        });
        live["featurelayers"][id] = fl;
      }
    }
  });
  $.each(live["featurelayers"], function(id, fl){
    if(fl != undefined)
    {
      fl.addTo(live["map"]);
      geosite.intend("layerLoaded", {'layer': id}, $scope);
    }
    else
    {
      console.log("Could not add featurelayer "+id+" because it is undefined.");
    }
  });
  //////////////////////////////////////
  $scope.$on("refreshMap", function(event, args) {
    // Forces Refresh
    console.log("Refreshing map...");
    // Update Visibility
    var visibleBaseLayer = args.state.view.baselayer;
    $.each(live["baselayers"], function(id, layer) {
      var visible = id == visibleBaseLayer;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    var visibleFeatureLayers = args.state.view.featurelayers;
    $.each(live["featurelayers"], function(id, layer) {
      var visible = $.inArray(id, visibleFeatureLayers) != -1;
      if(live["map"].hasLayer(layer) && !visible)
      {
        live["map"].removeLayer(layer)
      }
      else if((! live["map"].hasLayer(layer)) && visible)
      {
        live["map"].addLayer(layer)
      }
    });
    // Update Render Order
    var renderLayers = $.grep(layersAsArray(live["featurelayers"]), function(layer){ return $.inArray(layer["id"], visibleFeatureLayers) != -1;});
    var renderLayersSorted = sortLayers($.map(renderLayers, function(layer, i){return layer["layer"];}),true);
    var baseLayersAsArray = $.map(live["baselayers"], function(layer, id){return {'id':id,'layer':layer};});
    var baseLayers = $.map(
      $.grep(layersAsArray(live["baselayers"]), function(layer){return layer["id"] == visibleBaseLayer;}),
      function(layer, i){return layer["layer"];});
    updateRenderOrder(baseLayers.concat(renderLayersSorted));
    // Update Styles

    // Force Refresh
    setTimeout(function(){live["map"]._onResize()}, 0);
  });

  $scope.$on("changeView", function(event, args) {
    console.log("Refreshing map...");
    if(args["layer"] != undefined)
    {
      live["map"].fitBounds(live["featurelayers"][args["layer"]].getBounds());
    }
  });
};


var buildPageURL = function(page, state)
{
  var url = geosite.initial_data["pages"][page]["url"]
    .replace("{iso3}", state["iso3"])
    .replace("{hazard}", state["hazard"])
    .replace("{month}", state["month"]);

  var hash_args = [];
  var view = state["view"];
  if(view != undefined && view["z"] != undefined && view["lat"] != undefined && view["lon"] != undefined)
  {
    hash_args.push("z="+view["z"]);
    hash_args.push("lat="+view["lat"].toFixed(4));
    hash_args.push("lon="+view["lon"].toFixed(4));
  }
  var filters = state["filters"];
  if(filters)
  {
      $.each(state["filters"], function(layer_id, layer_filters)
      {
        $.each(layer_filters, function(filter_id, filter_value)
        {
            hash_args.push(layer_id+":"+filter_id+"="+filter_value);
        });
      });
  }
  if(hash_args.length > 0)
  {
    url += "#"+hash_args.join("&");
  }
  return url;
};

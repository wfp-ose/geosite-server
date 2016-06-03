var geosite = {
  'init': {},
  'directives': {},
  'controllers': {},
  'filters': {},
  'vecmath': {},
  'tilemath': {},
  'api': {},
  'listeners': {}
};

geosite.init.listeners = function()
{
  $('body').on('click', '.btn-clear', function(event) {
    var selector = $(this).data('clear');
    $(selector).each(function(){
      var input = $(this);
      input.val(null);
      // Update Typeahead backend if exists
      if(input.data('backend') != undefined)
      {
        var backend = $('#'+input.data('backend'));
        backend.val(null);
        backend.trigger('input');
        backend.change();
      }
    });
  });

  $('body').on('click', '.geosite-intent', function(event) {
    event.preventDefault();  // For anchor tags
    var that = $(this);
    var scope = angular.element('[ng-controller='+that.data('intent-ctrl')+']').scope();
    if(that.hasClass('geosite-toggle'))
    {
      if(that.hasClass('geosite-off'))
      {
        that.removeClass('geosite-off');

        geosite.api.intend(that.data('intent-names')[0], that.data('intent-data'), scope);
      }
      else
      {
        that.addClass('geosite-off');
        geosite.api.intend(that.data('intent-names')[1], that.data('intent-data'), scope);
      }
    }
    else if(that.hasClass('geosite-radio'))
    {
      var siblings = that.parents('.geosite-radio-group:first').find(".geosite-radio").not(that);
      if(!(that.hasClass('geosite-on')))
      {
        that.addClass('geosite-on');
        if(that.data("intent-class-on"))
        {
          that.addClass(that.data("intent-class-on"));
          siblings.removeClass(that.data("intent-class-on"));
        }
        siblings.removeClass('geosite-on');
        if(that.data("intent-class-off"))
        {
          that.removeClass(that.data("intent-class-off"));
          siblings.addClass(that.data("intent-class-off"));
        }
        geosite.api.intend(that.data('intent-name'), that.data('intent-data'), scope);
      }
    }
    else
    {
      geosite.api.intend(that.data('intent-name'), that.data('intent-data'), scope);
    }
  });
};

geosite.api.welcome = function(options)
{
  options = options || {};
  var scope = options['$scope'] || options['scope'] || angular.element("#geosite-main").scope();
  var intentData = {
    "id": "geosite-modal-welcome",
    "dynamic": {},
    "static": {
      "welcome": scope.map_config["welcome"]
    }
  };
  geosite.api.intend("toggleModal", intentData, scope);
};

/**
 * Used for intents (requesting and action), such as opening modals, zooming the map, etc.
 * @param {string} name of the intent (toggleModal, refreshMap, filterChanged)
 * @param {object} JSON package for intent
 * @param {object} Angular Scope object for emiting the event up the DOM.  This should correspond to an element's paranet controller.
*/
geosite.api.intend = function(name, data, scope)
{
  scope.$emit(name, data);
};


geosite.assert_float = function(x, fallback)
{
  if(x === undefined || x === "")
  {
    return fallback;
  }
  else if(angular.isNumber(x))
  {
    return x;
  }
  else
  {
    return parseFloat(x);
  }
};

geosite.assert_array_length = function(x, length, fallback)
{
  if(x === undefined || x === "")
  {
    return fallback;
  }
  else if(angular.isString(x))
  {
    x = x.split(",");
    if(x.length == length)
    {
      return x;
    }
    else
    {
      return fallback;
    }
  }
  else if(angular.isArray(x))
  {
    if(x.length == length)
    {
      return x;
    }
    else
    {
      return fallback;
    }
  }
};

geosite.api.opt = function(options, names, fallback, fallback2)
{
  if(options != undefined)
  {
    if($.isArray(names))
    {
      var value = undefined;
      for(var i = 0; i < names.length; i++)
      {
        value = options[names[i]];
        if(value != undefined)
            break;
      }
      return value || fallback || fallback2;
    }
    else
        return options[names] || fallback ||  fallback2;
  }
  else
      return fallback || fallback2;
};
geosite.api.opt_i = function(options, names, fallback)
{
  return geosite.api.opt(options, names, fallback, 0);
};
geosite.api.opt_s = function(options, names, fallback)
{
  return geosite.api.opt(options, names, fallback, "");
};
geosite.api.opt_b = function(options, names, fallback)
{
  return geosite.api.opt(options, names, fallback, false);
};
geosite.api.opt_j = function(options, names, fallback)
{
  return geosite.api.opt(options, names, fallback, {});
};

geosite.api.normalize_feature = function(feature)
{
  var feature = {
    'attributes': feature.attributes || feature.properties,
    'geometry': feature.geometry
  };
  return feature;
};

geosite.api.flatten = function(obj, prefix)
{
  var newObject = {};
  $.each(obj, function(key, value){
    var newKey = prefix != undefined ? prefix+"__"+key : key;
    if(
      (value === undefined) ||
      (value === null) ||
      angular.isString(value) ||
      angular.isNumber(value) ||
      angular.isArray(value) ||
      (typeof value == "boolean")
    )
    {
      newObject[newKey] = value;
    }
    else
    {
      $.each(geosite.api.flatten(value, newKey), function(key2, value2){
        newObject[key2] = value2;
      });
    }
  });
  return newObject;
};

geosite.api.unpack = function(obj)
{
  var newObject = {};
  $.each(obj, function(key, value){
    if(key.indexOf("__") == -1)
    {
      newObject[key] = value;
    }
    else
    {
      var keyChain = key.split("__");
      var target = obj;
      for(var j = 0; j < keyChain.length; j++)
      {
        var newKey = keyChain[j];
        if(!(newKey in target))
        {
          target[newKey] = {};
        }
        target = target[newKey];
      }
      target[keyChain[keyChain.length-1]] = value;
    }
  });
  return newObject;
};


geosite.listeners.toggleModal = function(event, args)
{
    console.log('event', event);
    console.log('args', args);
    //
    var main_scope = angular.element("#geosite-main").scope();
    var id = args["id"];
    var modalOptions = args['modal'] || {};
    modalOptions['show'] = false;
    var modal_scope = angular.element("#"+id).scope();
    var modal_scope_new = {
      "state": main_scope.state
    };
    if("static" in args)
    {
      modal_scope_new = $.extend(modal_scope_new, args["static"]);
    }
    if("dynamic" in args)
    {
      $.each(args["dynamic"],function(key, value){
        if(angular.isString(value))
        {
          if(value == "map_config")
          {
            modal_scope_new[key] = map_config;
          }
          else if(value == "state")
          {
            modal_scope_new[key] = modal_scope_new.state;
          }
        }
        else if(angular.isArray(value))
        {
          if(value[0] == "source")
          {
            modal_scope_new[key] = extract(value.slice(1), event.targetScope);
          }
          else
          {
            if(value[0] == "map_config")
            {
              modal_scope_new[key] = extract(value.slice(1), map_config);
            }
            else if(value[0] == "state")
            {
              modal_scope_new[key] = extract(value.slice(1), modal_scope_new.state);
            }
          }
        }
        else
        {
          modal_scope_new[key] = value;
        }
      });
    }
    modal_scope.$apply(function () {
        // Update Scope
        modal_scope = $.extend(modal_scope, modal_scope_new);
        setTimeout(function(){
          // Update Modal Tab Selection
          // See https://github.com/angular-ui/bootstrap/issues/1741
          var modalElement = $("#"+id);
          var targetTab = modal_scope.tab;
          if(targetTab != undefined)
          {
            modalElement.find('.nav-tabs li').each(function(){
              var that = $(this);
              var thisTab = that.find('a').attr('href').substring(1);
              if(targetTab == thisTab)
              {
                  that.addClass('active');
              }
              else
              {
                  that.removeClass('active');
              }
            });
            modalElement.find('.tab-pane').each(function(){
              var that = $(this);
              if(targetTab == that.attr('id'))
              {
                  that.addClass('in active');
              }
              else
              {
                  that.removeClass('in active');
              }
            });
          }
          else
          {
            modalElement.find('.nav-tabs li').slice(0, 1).addClass('active');
            modalElement.find('.nav-tabs li').slice(1).removeClass('active');
            modalElement.find('.tab-pane').slice(0, 1).addClass('in active');
            modalElement.find('.tab-pane').slice(1).removeClass('in active');
          }
          // Toggle Modal
          $("#"+id).modal(modalOptions);
          $("#"+id).modal('toggle');
        },0);
    });
};

geosite.init_controller_base = function(app)
{
  app.controller("GeositeControllerBase", geosite.controllers.controller_base);
};

geosite.init_controller = function(that, app, controller)
{
  var controllerName = that.data('controllerName') || that.attr('id');

  app.controller(controllerName, controller || geosite.controllers.controller_base);
};

geosite.init_controllers = function(that, app, controllers)
{
  for(var i = 0; i < controllers.length; i++)
  {
    var c = controllers[i];
    $(c.selector, that).each(function(){
        try
        {
          geosite.init_controller($(this), app, c.controller);
        }
        catch(err)
        {
          console.log("Could not load Geosite Controller \""+c.selector+"\"", err);
        }
    });
  }
};

geosite.vecmath = {};

geosite.vecmath.distance = function(a, b)
{
  var p = L.Projection.SphericalMercator;
  if(b.toString != undefined && b.toString().startsWith('LatLng'))
  {
    return (p.project(a)).distanceTo(p.project(b));
  }
  else
  {
    var minDistance = undefined;
    $.each(b._layers, function(id, layer)
    {
      var verticies = layer._latlngs;
      var i = 0;
      if(minDistance == undefined)
      {
        minDistance = L.LineUtil.pointToSegmentDistance(
          p.project(a),
          p.project(verticies[i]),
          p.project(verticies[i+1]));
        i++;
      }
      for(; i < verticies.length -1; i++)
      {
        var d = L.LineUtil.pointToSegmentDistance(
          p.project(a),
          p.project(verticies[i]),
          p.project(verticies[i+1]));
        if(d < minDistance)
        {
          minDistance = d;
        }
      }
    });
    return minDistance;
  }
};

geosite.vecmath.closestLocation = function(a, b)
{
  if(b.toString != undefined && b.toString().startsWith('LatLng'))
  {
    return b;
  }
  else
  {
    var p = L.Projection.SphericalMercator;
    var minDistance = undefined;
    var closestPoint = undefined;
    $.each(b._layers, function(id, layer)
    {
      var verticies = layer._latlngs;
      var i = 0;
      if(minDistance == undefined)
      {
        minDistance = L.LineUtil.pointToSegmentDistance(
          p.project(a),
          p.project(verticies[i]),
          p.project(verticies[i+1]));
        closestPoint = L.LineUtil.closestPointOnSegment(
          p.project(a),
          p.project(verticies[i]),
          p.project(verticies[i+1]));
        i++;
      }
      for(; i < verticies.length -1; i++)
      {
        var d = L.LineUtil.pointToSegmentDistance(
          p.project(a),
          p.project(verticies[i]),
          p.project(verticies[i+1]));
        if(d < minDistance)
        {
          minDistance = d;
          closestPoint = L.LineUtil.closestPointOnSegment(
            p.project(a),
            p.project(verticies[i]),
            p.project(verticies[i+1]));
        }
      }
    });
    return p.unproject(closestPoint);
  }
};

geosite.vecmath.getClosestFeatureAndLocation = function(nearbyFeatures, target)
{
  var closestFeature = undefined;
  var closestDistance = 0;
  var closestLocation = undefined;
  if(nearbyFeatures != undefined)
  {
    if(nearbyFeatures.length > 0)
    {
      closestFeature = nearbyFeatures[0];
      closestDistance = geosite.vecmath.distance(target, nearbyFeatures[0].geometry);
      closestLocation = geosite.vecmath.closestLocation(target, nearbyFeatures[0].geometry);
      for(var i = 1; i < nearbyFeatures.length ;i++)
      {
        var f = nearbyFeatures[i];
        if(geosite.vecmath.distance(target, f.geometry) < closestDistance)
        {
          closestFeature = f;
          closestDistance = geosite.vecmath.distance(target, f.geometry);
          closestLocation = geosite.vecmath.closestLocation(target, f.geometry);
        }
      }
    }
  }
  return {'feature': closestFeature, 'location': closestLocation};
};

/**
 * init_state will overwrite the default state from the server with params in the url.
 * @param {Object} state - Initial state from server
 */
geosite.init_state = function(state, stateschema)
{
  var newState = $.extend({}, state);

  // Update View
  var lat = getHashValueAsFloat(["latitude", "lat", "y"]) || state["lat"] || 0.0;
  var lon = getHashValueAsFloat(["longitude", "lon", "long", "lng", "x"]) || state["lon"] || 0.0;
  var z = getHashValueAsInteger(["zoom", "z"]) || state["z"] || 3;
  var delta = {'lat': lat, 'lon': lon, 'z': z};
  newState["view"] = newState["view"] != undefined ? $.extend(newState["view"], delta) : delta;

  // Update Filters
  if(newState["filters"] != undefined)
  {
    $.each(newState["filters"], function(layer_id, layer_filters){
      $.each(layer_filters, function(filter_id, filer_value){
        var type = stateschema["filters"][layer_id][filter_id].toLowerCase();
        var value = getHashValue(layer_id+":"+filter_id, type);
        if(value != undefined && value != "")
        {
          newState["filters"][layer_id][filter_id] = value;
        }
      });
    });
  }

  // Update Filters
  if(newState["styles"] != undefined)
  {
    /*
    $.each(newState["styles"], function(layer_id, layer_style){
      var type = stateschema["filters"][layer_id][filter_id].toLowerCase();
      var value = getHashValue("style:"+layer_id, type);
      if(value != undefined && value != "")
      {
        newState["filters"][layer_id][filter_id] = value;
      }
    });*/
  }

  return newState;
};

/**
 * Initializes a filter slider's label
 * @constructor
 * @param {Object} that - DOM element for slider
 * @param {string} type - Either ordinal or continuous
 * @param {Object} range - Either true, "min", or "max".
 * @param {Object} value - If range is true, then integer array, else integer.
 */
geosite.ui_init_slider_label = function($interpolate, that, type, range, value)
{
  if(type=="ordinal")
  {
    var ctx = {"value": value};
    that.data('label').html($interpolate(that.data('label-template'))(ctx));
  }
  else if(type=="continuous")
  {
    if(($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true"))
    {
      var ctx = {"values": [value[0], value[1]]};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
    else if(range=="min" || range=="max")
    {
      var ctx = {"value": value};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
  }
};

/**
 * Initializes a filter slider's label
 * @constructor
 * @param {Object} $interplate - Angular $interpolate function
 * @param {Object} $scope - Angular $scope
 * @param {Object} that - DOM element for slider
 * @param {string} type - Either ordinal or continuous
 * @param {Object} range - Either true, "min", or "max".
 * @param {Object} value - If range is true, then integer array, else integer.
 */
geosite.ui_init_slider_slider = function($interpolate, $scope, that, type, range, value, minValue, maxValue, step)
{
  if(type=="ordinal")
  {
    that.slider({
      range: (($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true")) ? true : range,
      value: value,
      min: 0,
      max: maxValue,
      step: 1,
      slide: function(event, ui) {
          geosite.ui_update_slider_label.apply(this, [$interpolate, event, ui]);
          var output = that.data('output');
          var newValue = that.data('options')[ui.value];
          var filter = {};
          filter[output] = newValue;
          geosite.api.intend("filterChanged", {"layer":"popatrisk", "filter":filter}, $scope);
      }
    });
  }
  else if(type=="continuous")
  {
    if(($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true"))
    {
      that.slider({
        range: true,
        values: value,
        min: minValue,
        max: maxValue,
        step: step,
        slide: function(event, ui) {
            geosite.ui_update_slider_label.apply(this, [$interpolate, event, ui]);
            var output = that.data('output');
            var newValue = ui.values;
            var filter = {};
            filter[output] = newValue;
            geosite.api.intend("filterChanged", {"layer":"popatrisk", "filter":filter}, $scope);
        }
      });
    }
    else if(range=="min" || range=="max")
    {
      that.slider({
        range: range,
        value: value,
        min: minValue,
        max: maxValue,
        step: step,
        slide: function(event, ui) {
            geosite.ui_update_slider_label.apply(this, [$interpolate, event, ui]);
            var output = that.data('output');
            var newValue = ui.value / 100.0;
            var filter = {};
            filter[output] = newValue;
            geosite.api.intend("filterChanged", {"layer":"popatrisk", "filter":filter}, $scope);
        }
      });
    }
  }
};


/**
 * Updates a filter slider's label
 * @constructor
 * @param {Object} event - A jQuery UI event object
 * @param {Object} author - A jQuery UI ui object
 */
geosite.ui_update_slider_label = function($interpolate, event, ui)
{
  var that = $(this);
  var type = that.data('type');
  var range = that.data('range');

  if(type=="ordinal")
  {
    var ctx = {"value": that.data('options')[ui.value]};
    that.data('label').html($interpolate(that.data('label-template'))(ctx));
  }
  else if(type=="continuous")
  {
    if(($.type(range) == "boolean" && range ) || (range.toLowerCase() == "true"))
    {
      var ctx = {"values": [ui.values[0], ui.values[1]]};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
    else if(range=="min" || range=="max")
    {
      var ctx = {"value": (ui.value / 100.0)};
      that.data('label').html($interpolate(that.data('label-template'))(ctx));
    }
  }
};

var getHashValue = function(keys, type)
{
    var value = undefined;
    if(typeof keys === 'string')
    {
      keys = [keys.toLowerCase()];
    }
    else
    {
      keys = $.map(keys,function(value, i){return value.toLowerCase();});
    }
    var hash_lc = location.hash.toLowerCase();
    for(var i = 0; i < keys.length; i++)
    {
      var key = keys[i];
      var keyAndHash = hash_lc.match(new RegExp(key + '=([^&]*)'));
      if(keyAndHash)
      {
          value = keyAndHash[1];
          if(value != undefined && value != null && value != "")
          {
            break;
          }
      }
    }

    if(type != undefined)
    {
        if(type == "integer")
        {
          value = (value != undefined && value != null && value != "") ? parseInt(value, 10) : undefined;
        }
        else if(type == "stringarray")
        {
          if(value != undefined)
          {
            var newValue = value.split(",");
            value = newValue;
          }
        }
        else if(type == "integerarray")
        {
          if(value != undefined)
          {
            var sValue = value.split(",");
            var newValue = [];
            for(var i = 0; i < sValue.length; i++)
            {
              var v = sValue[i];
              newValue.push((v != undefined && v != null && v != "") ? parseInt(v, 10) : undefined);
            }
            value = newValue;
          }
        }
        else if(type == "float")
        {
          value = (value != undefined && value != null && value != "") ? parseFloat(value) : undefined;
        }
        else if(type == "floatarray")
        {
          if(value !=undefined)
          {
            var sValue = value.split(",");
            var newValue = [];
            for(var i = 0; i < sValue.length; i++)
            {
              var v = sValue[i];
              newValue.push((v != undefined && v != null && v != "") ? parseFloat(v) : undefined);
            }
            value = newValue;
          }
        }
    }
    return value;
};
var hasHashValue = function(keys)
{
    var value = getHashValue(keys);
    return value != undefined && value != null && value != "";
};
var getHashValueAsStringArray = function(keys)
{
  return getHashValue(keys, "stringarray");
};
var getHashValueAsInteger = function(keys)
{
  return getHashValue(keys, "integer");
};
var getHashValueAsIntegerArray = function(keys)
{
  return getHashValue(keys, "integerarray");
};
var getHashValueAsFloat = function(keys)
{
  return getHashValue(keys, "float");
};
var sortLayers = function(layers, reverse)
{
  var renderLayers = $.isArray(layers) ? layers : $.map(layers, function(layer){return layer;});
  renderLayers = renderLayers.sort(function(a, b){
      return a.options.renderOrder - b.options.renderOrder;
  });
  if(reverse === true)
    renderLayers.reverse();
  return renderLayers;
};
var updateRenderOrder = function(layers)
{
    for(var i = 0; i < layers.length; i++)
    {
        layers[i].bringToFront();
    }
};
var layersAsArray = function(layers)
{
  return $.map(layers, function(layer, id){return {'id':id, 'layer':layer};});
};
var extract = function(keyChain, node)
{
	var obj = undefined;
	if(keyChain.length==0)
	{
		obj = node;
	}
	else
	{
		if(node!=undefined)
		{
			var newKeyChain = keyChain.slice(1);
			var newNode = Array.isArray(node) ? node[keyChain[0]]: node[""+keyChain[0]];
			obj = extract(newKeyChain, newNode);
		}
	}
	return obj;
};

geosite.codec = {};

geosite.codec.parseFeatures = function(response, fields_by_featuretype)
{
  var features = [];
  //$(response).find("FeatureCollection")  No need to search for featurecollection.  It IS the featurecollection
  $(response).find('gml\\:featuremember').each(function(){
      //var f = $(this).find(typeName.indexOf(":") != -1 ? typeName.substring(typeName.indexOf(":") + 1) : typeName);
      var f = $(this).children();
      var typeName = f.prop("tagName").toLowerCase();
      var attributes = geosite.codec.parseAttributes(f, fields_by_featuretype[typeName]);
      var shape = f.find("geonode\\:shape");
      var geom = undefined;
      if(shape.find("gml\\:point").length > 0)
      {
        var coords = shape.find("gml\\:point").find("gml\\:coordinates").text().split(",");
        geom = new L.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
      }
      else if(shape.find("gml\\:multilinestring").length > 0)
      {
        var coords = shape.find("gml\\:multilinestring")
          .find("gml\\:linestringmember")
          .find("gml\\:linestring")
          .find("gml\\:coordinates")
          .text().split(" ");
        coords = $.map(coords, function(x, i){
          var a = x.split(",");
          return [[parseFloat(a[0]), parseFloat(a[1])]];
        });
        var geojson = [{"type": "LineString","coordinates": coords}];
        geom = new L.GeoJSON(geojson, {});
      }
      var newFeature = {
        'featuretype': typeName,
        'attributes': attributes,
        'geometry': geom
      };
      features.push(newFeature);
  });
  return features;
};
geosite.codec.parseAttributes  = function(element, fields)
{
  var attributes = {};
  for(var k = 0; k < fields.length; k++)
  {
    var field = fields[k];
    var attributeName = field['output'] || field['attribute'];
    attributes[attributeName] = undefined;
    var inputName = field['attribute'] || field['input'];
    var inputNames = inputName != undefined ? [inputName] : field['inputs'];
    if(inputNames!= undefined)
    {
      for(var l = 0; l < inputNames.length; l++)
      {
        var inputName = inputNames[l];
        if(element.find("geonode\\:"+inputName).length > 0)
        {
          attributes[attributeName] = element.find("geonode\\:"+inputName).text();
          break;
        }
      }
    }
  }
  return attributes;
};

geosite.popup = {};

geosite.popup.buildChart = function(chart, layer, feature, state)
{
  var html = "";
  html += "<div style=\"text-align:center;\"><b>"+chart.label+"</b></div><br>";
  html += "<div id=\""+chart.id+"\" class=\"geosite-popup-chart\"></div>";
  return html;
}

geosite.popup.buildField = function(field, layer, feature, state)
{
  var output = field["output"] || field["attribute"];
  var html = undefined;
  var bInclude = false;
  if(field.when != undefined)
  {
    if(field.when.toLowerCase() == "defined")
    {
      if(feature.attributes[output] != undefined)
      {
        bInclude = true;
      }
    }
    else
    {
      bInclude = true;
    }
  }
  else
  {
    bInclude = true;
  }

  if(bInclude)
  {
    if(field.type == "link")
    {
      var value = field.value != undefined ? field.value : "{{ feature.attributes." + output + " }}";
      html = "<span><b>"+ field.label +":</b> <a target=\"_blank\" href=\""+field.url+"\">";
      html += value;
      html += "</a></span>";
    }
    else
    {
      var value = undefined;
      if(field.value != undefined)
      {
        value = field.value;
      }
      else
      {
        if(field.type == "date")
        {
          var format = field.format || "medium";
          value = "feature.attributes." + output + " | date:'"+format+"'"
        }
        else
        {
          value = "feature.attributes." + output
        }
        if(field.fallback)
        {
          value = "("+value+") || '"+field.fallback+"'"
        }
        value = "{{ "+value +" }}";
      }
      html = "<span><b>"+ field.label +":</b> "+value+"</span>";
    }
  }
  return html;
};

geosite.popup.buildPopupTemplate = function(popup, layer, feature, state)
{
  var panes = popup.panes;
  var popupTemplate = "";
  //////////////////
  if(angular.isDefined(popup.title))
  {
    popupTemplate += "<h5 style=\"word-wrap:break-word;text-align:center;\">"+popup.title+"</h5>";
  }
  //////////////////
  var paneContents = [];
  for(var i = 0; i < panes.length; i++)
  {
    var pane = panes[i];
    var popupFields = [];
    var popupCharts = [];
    if("fields" in pane)
    {
      for(var j = 0; j < pane.fields.length; j++)
      {
        var popupField = geosite.popup.buildField(pane.fields[j], layer, feature, state);
        if(popupField != undefined)
        {
          popupFields.push(popupField);
        }
      }
    }
    if("charts" in pane)
    {
      for(var j = 0; j < pane.charts.length; j++)
      {
        var popupChart = geosite.popup.buildChart(pane.charts[j], layer, feature, state);
        if(popupChart != undefined)
        {
          popupCharts.push(popupChart);
        }
      }
    }
    var paneContent = popupFields.join("<br>");
    if(popupCharts.length > 0)
    {
      paneContent += "<hr>" + popupCharts.join("<br>");
    }
    paneContents.push(paneContent);
  }
  //////////////////
  if(panes.length > 1)
  {
    var tabs = [];
    var pane = panes[0];
    var html_tab ="<li class=\"active\"><a data-toggle=\"tab\" href=\"#"+pane.id+"\">"+pane.tab.label+"</a></li>";
    tabs.push(html_tab);
    for(var i = 1; i < panes.length; i++)
    {
      pane = panes[i];
      html_tab = "<li><a data-toggle=\"tab\" href=\"#"+pane.id+"\">"+pane.tab.label+"</a></li>"
      tabs.push(html_tab);
    }
    var html_tabs = "<ul class=\"nav nav-tabs nav-justified\">"+tabs.join("")+"</ul>";
    ///////////////
    var paneContentsWithWrapper = [];
    var html_pane = "<div id=\""+panes[0].id+"\" class=\"tab-pane fade in active\">"+paneContents[0]+"</div>";
    paneContentsWithWrapper.push(html_pane);
    for(var i = 1; i < panes.length; i++)
    {
      html_pane = "<div id=\""+panes[i].id+"\" class=\"tab-pane fade\">"+paneContents[i]+"</div>";
      paneContentsWithWrapper.push(html_pane);
    }
    ///////////////
    popupTemplate += html_tabs + "<div class=\"tab-content\">"+paneContentsWithWrapper.join("")+"</div>";
  }
  else
  {
    popupTemplate += paneContents[0];
  }
  return popupTemplate;
};

geosite.popup.buildPopupContent = function($interpolate, featureLayer, feature, state)
{
  var popupTemplate = geosite.popup.buildPopupTemplate(featureLayer.popup, featureLayer, feature, state);
  var ctx = {
    'layer': featureLayer,
    'feature': feature,
    'state': state
  };
  return $interpolate(popupTemplate)(ctx);
};

geosite.popup.openPopup = function($interpolate, featureLayer, feature, location, map, state)
{
  var popupContent = geosite.popup.buildPopupContent($interpolate, featureLayer, feature, state);
  var popup = new L.Popup({maxWidth: (featureLayer.popup.maxWidth || 400)}, undefined);
  popup.setLatLng(new L.LatLng(location.lat, location.lon));
  popup.setContent(popupContent);
  map.openPopup(popup);
};

geosite.tilemath = {
  "D2R": Math.PI / 180,
  "R2D": 180 / Math.PI
};

geosite.tilemath.point_to_bbox = function(x, y, z, digits)
{
  var radius = geosite.tilemath.point_to_radius(z);
  var e = x + radius; if(digits != undefined && digits >= 0){e = e.toFixed(digits);}
  var w = x - radius; if(digits != undefined && digits >= 0){w = w.toFixed(digits);}
  var s = y - radius; if(digits != undefined && digits >= 0){s = s.toFixed(digits);}
  var n = y + radius; if(digits != undefined && digits >= 0){n = n.toFixed(digits);}
  return [w, s, e, n];
};

geosite.tilemath.point_to_radius = function(z)
{
  return (geosite.config.click_radius || 4.0) / z;
};

geosite.tilemath.tms_to_bbox = function(x, y, z)
{
  var e = geosite.tilemath.tile_to_lon(x+1, z);
  var w = geosite.tilemath.tile_to_lon(x, z);
  var s = geosite.tilemath.tile_to_lat(y+1, z);
  var n = geosite.tilemath.tile_to_lat(y, z);
  return [w, s, e, n];
};


geosite.tilemath.tile_to_lon = function(x, z)
{
  return x / Math.pow(2, z) * 360-180;
};


geosite.tilemath.tile_to_lat = function(y, z)
{
  n = Math.pi - 2 * Math.PI * y / Math.pow(2,z);
  return ( R2D * Math.atan(0.5 * ( Math.exp(n) - Math.exp(-n))));
};

geosite.http = {};

geosite.http.build_promises = function($http, urls)
{
  var promises = [];
  for(var i = 0; i < urls.length; i++)
  {
    var url = urls[i];
    var config = {};
    var promise = $http.get(url, config);
    promises.push(promise);
  }
  return promises;
};
geosite.http.build_features = function(responses, fields_by_featuretype)
{
  var features = [];
  for(var i = 0; i < responses.length; i++)
  {
    var response = responses[i];
    if(response.status == 200)
    {
      var data = response.data;
      features = features.concat(geosite.codec.parseFeatures(data, fields_by_featuretype));
    }
  }
  return features;
};

geosite.layers = {};

geosite.layers.aggregate_fields = function(featureLayer)
{
  var fields = [];
  for(var i = 0; i < featureLayer.popup.panes.length; i++)
  {
    fields = fields.concat(featureLayer.popup.panes[i].fields);
  }
  return fields;
};
geosite.layers.init_baselayers = function(map, baselayers)
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
geosite.layers.init_featurelayer_post = function($scope, live, id, fl, visible)
{
  if(fl != undefined)
  {
    if(visible != undefined ? visible : true)
    {
      fl.addTo(live["map"]);
    }
    geosite.api.intend("layerLoaded", {'type':'featurelayer', 'layer': id, 'visible': visible}, $scope);
  }
  else
  {
    console.log("Could not add featurelayer "+id+" because it is undefined.");
  }
};
geosite.layers.init_featurelayer_wms = function($scope, live, map_config, id, layerConfig)
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
    attribution: layerConfig.source.attribution
  });
  live["featurelayers"][id] = fl;
  geosite.layers.init_featurelayer_post($scope, live, id, fl, layerConfig.visible);
};
geosite.layers.init_featurelayer_geojson = function($scope, live, map_config, id, layerConfig)
{
  $.ajax({
    url: layerConfig.source.url,
    dataType: "json",
    success: function(response){
      var fl = undefined;
      if(layerConfig.transform == "heatmap")
      {
        var heatLayerData = [];
        var maxIntensity = 0;
        for(var i = 0; i < response[0]["features"].length; i++)
        {
          var intensity = ("attribute" in layerConfig["heatmap"] && layerConfig["heatmap"]["attribute"] != "") ? response[0]["features"][i]["properties"][layerConfig["heatmap"]["attribute"]] : 1.0;
          heatLayerData.push([
            response[0]["features"][i]["geometry"]["coordinates"][1],
            response[0]["features"][i]["geometry"]["coordinates"][0],
            intensity
          ]);
          if(intensity > maxIntensity)
          {
            maxIntensity = intensity;
          }
        }
        for(var i = 0; i < heatLayerData.length; i++)
        {
          heatLayerData[i][2] = heatLayerData[i][2] / maxIntensity;
        }

        var canvas = L.heatCanvas();
        fl = L.heatLayer(heatLayerData, {
          "renderer": canvas,
          "attribution": layerConfig["source"]["attribution"],
          "radius": (layerConfig["heatmap"]["radius"] || 25),
          "blur": (layerConfig["heatmap"]["blur"] || 15),
          "max": (layerConfig["heatmap"]["max"] || 1.0),
          "minOpacity": (layerConfig["heatmap"]["minOpacity"] || 0.5)
        });
      }
      else
      {
        fl = L.geoJson(response, {
          attribution: layerConfig.source.attribution
        });
      }
      live["featurelayers"][id] = fl;
      geosite.layers.init_featurelayer_post($scope, live, id, fl, layerConfig.visible);
    }
  });
};
geosite.layers.init_featurelayer = function(id, layerConfig, $scope, live, map_config)
{
  if(layerConfig.enabled == undefined || layerConfig.enabled == true)
  {
    if(layerConfig.type.toLowerCase() == "geojson")
    {
      geosite.layers.init_featurelayer_geojson($scope, live, map_config, id, layerConfig);
    }
    else if(layerConfig.type.toLowerCase() == "wms")
    {
      geosite.layers.init_featurelayer_wms($scope, live, map_config, id, layerConfig);
    }
  }
};
geosite.layers.init_featurelayers = function(featureLayers, $scope, live, map_config)
{
  $.each(featureLayers, function(id, layerConfig){
    geosite.layers.init_featurelayer(id, layerConfig, $scope, live, map_config);
  });
};

var geositeserver = {};

geositeserver.welcome = function(options)
{
  options = options || {};
  var scope = options['$scope'] || options['scope'] || angular.element("#geosite-main").scope();
  var intentData = {
    "id": "geositeserver-modal-welcome",
    "modal": {
      "backdrop": "static",
      "keyboard": false
    },
    "dynamic": {},
    "static": {
      "welcome": scope.map_config["welcome"]
    }
  };
  geosite.api.intend("toggleModal", intentData, scope);
};

geosite.config = {
  'click_radius': 2.0
};

geosite.init_dashboard = function(appName)
{
  geosite.app = app = angular.module(appName, ['ngRoute', 'ngSanitize']);

  if(geosite.templates != undefined)
  {
    $.each(geosite.templates, function(name, template){
      app.run(function($templateCache){$templateCache.put(name,template);});
    });
  }

  if(geosite.filters != undefined)
  {
    $.each(geosite.filters, function(name, func){ app.filter(name, func); });
  }

  if(geosite.directives != undefined)
  {
    $.each(geosite.directives, function(name, dir){ app.directive(name, dir); });
  }

  app.factory('state', function(){return $.extend({}, geosite.initial_state);});
  app.factory('stateschema', function(){return $.extend({}, geosite.state_schema);});
  app.factory('map_config', function(){return $.extend({}, geosite.map_config);});
  app.factory('live', function(){
    return {
      "map": undefined,
      "baselayers": {},
      "featurelayers": {
        "popatrisk":undefined
      }
    };
  });
  // Initialize UI interaction for intents.
  // Listen's for events bubbling up to body element, so can initialize before children.
  geosite.init.listeners();

  /*
  init_geositeserver_controller_main will kick off a recursive search for controllers
  to add to the angular app/module.  However, the initialization code in
  app.controller(...function(){XXXXX}) won't actually execute until
  angular.bootstrap is called.  Therefore, each controller should Initialize
  in a breadth-first sequential order.

  If you miss a component with ng-controller, bootstrap will attempt
  to load it on its own within angular.bootstrap.  That'll error out
  and is not good.  So you NEED!!! to get to it first!!!!!!
  */

  geosite.init_controller_base(app);

  init_geositeserver_controller_main($('.geosite-controller.geosite-main'), app);

  angular.bootstrap(document, [appName]);
};

geosite.init_explore = function(appName)
{
  geosite.app = app = angular.module(appName, ['ngRoute','ngSanitize']);

  if(geosite.templates != undefined)
  {
    $.each(geosite.templates, function(name, template){
      app.run(function($templateCache){$templateCache.put(name, template);});
    });
  }

  if(geosite.filters != undefined)
  {
    $.each(geosite.filters, function(name, func){ app.filter(name, func); });
  }

  if(geosite.directives != undefined)
  {
    $.each(geosite.directives, function(name, dir){ app.directive(name, dir); });
  }

  app.factory('state', function(){return $.extend({}, geosite.initial_state);});
  app.factory('stateschema', function(){return $.extend({}, geosite.state_schema);});
  app.factory('map_config', function(){return $.extend({}, geosite.map_config);});
  app.factory('live', function(){
    return {
      "map": undefined,
      "baselayers": {},
      "featurelayers":{}
    };
  });

  // Initialize UI interaction for intents.
  // Listen's for events bubbling up to body element, so can initialize before children.
  geosite.init.listeners();

  /*
  init_geositeserver_controller_main will kick off a recursive search for controllers
  to add to the angular app/module.  However, the initialization code in
  app.controller(...function(){XXXXX}) won't actually execute until
  angular.bootstrap is called.  Therefore, each controller should Initialize
  in a breadth-first sequential order.

  If you miss a component with ng-controller, bootstrap will attempt
  to load it on its own within angular.bootstrap.  That'll error out
  and is not good.  So you NEED!!! to get to it first!!!!!!
  */

  geosite.init_controller_base(app);

  init_geositeserver_controller_main($('.geosite-controller.geosite-main'), app);

  angular.bootstrap(document, [appName]);

};

geosite.templates = {};
geosite.templates["modal_dashboard_config.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Dashboard Config / {{ map_config.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li role=\"presentation\" class=\"active\">\n            <a\n              href=\"#modal-dashboard-config-formatted\"\n              aria-controls=\"modal-dashboard-config-formatted\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Formatted</a>\n          </li>\n          <li role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-dashboard-config-json\"\n              aria-controls=\"modal-dashboard-config-json\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">JSON</a>\n          </li>\n          <li role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-dashboard-config-yaml\"\n              aria-controls=\"modal-dashboard-config-yaml\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">YAML</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-dashboard-config-formatted\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n          </div>\n          <div\n            id=\"modal-dashboard-config-json\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <pre style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ map_config | json }}</pre>\n          </div>\n          <div\n            id=\"modal-dashboard-config-yaml\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <pre style=\"word-wrap: break-word; white-space: pre-wrap;\">{{ map_config | yaml }}</pre>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_layer_carto.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }} / Cartography</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <p class=\"navbar-text\" style=\"margin-bottom:0px;\"><b>Select</b><br><b>a Style:</b></p>\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"style in layer.cartography track by $index\">\n            <a\n              class=\"geosite-intent\"\n              href=\"#modal-layer-carto-style-{{ style.id }}\"\n              aria-controls=\"modal-layer-carto-style-{{ style.id }}\"\n              data-intent-name=\"selectStyle\"\n              data-intent-data=\"{&quot;layer&quot;:&quot;{{ layerID }}&quot;,&quot;style&quot;:&quot;{{ style.id }}&quot;}\"\n              data-intent-ctrl=\"geosite-map-legend\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"style.title | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"style in layer.cartography track by $index\"\n            id=\"modal-layer-carto-style-{{ style.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>Attribute: </b><span>{{ style.attribute | default:\"Not styled by attribute\" }}</span></span><br>\n            <span><b>Mask: </b><span ng-bind-html=\"style.mask | md2html | default:\'No Mask\'\"></span></span><br>\n            <span><b>Description: </b><span ng-bind-html=\"style.description | md2html | default:\'Not specified\'\"></span></span>\n            <br>\n            <br>\n            <div\n              ng-if=\"style.type == \'graduated\'\"\n              geosite-symbol-graduated\n              style=\"style\"\n              container-width=\"{{ \'392px\' }}\">\n            </div>\n            <div\n              ng-if=\"style.legend.symbol.type == \'circle\'\"\n              geosite-symbol-circle\n              style=\"style\">\n            </div>\n            <div\n              ng-if=\"style.legend.symbol.type == \'graphic\'\"\n              geosite-symbol-graphic\n              style=\"style\">\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_layer_more.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li role=\"presentation\" class=\"active\">\n            <a\n              href=\"#modal-layer-more-general\"\n              aria-controls=\"modal-layer-more-general\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">General</a>\n          </li>\n          <li ng-if=\"layer.wfs\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-attributes\"\n              aria-controls=\"modal-layer-more-attributes\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Attributes</a>\n          </li>\n          <li ng-if=\"layer.wms\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-source\"\n              aria-controls=\"modal-layer-more-source\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Source</a>\n          </li>\n          <li ng-if=\"layer.wms\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-wms\"\n              aria-controls=\"modal-layer-more-wms\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">WMS</a>\n          </li>\n          <li ng-if=\"layer.wfs\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-wfs\"\n              aria-controls=\"modal-layer-more-wfs\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">WFS</a>\n          </li>\n          <li ng-if=\"layer.wfs\" role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-layer-more-download\"\n              aria-controls=\"modal-layer-more-download\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Download</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-layer-more-general\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"layer.description | md2html | default:\'No description given.\'\"></span>\n            <br><br><b>Type:</b> {{ layer.type }}\n            <br><br><b>Source:</b> {{ layer.source.name | default:\"Not specified\" }}\n          </div>\n          <div\n            ng-if=\"layer.wfs\"\n            id=\"modal-layer-more-attributes\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <div>\n              Placeholder\n            </div>\n          </div>\n          <div\n            ng-if=\"layer.source\"\n            id=\"modal-layer-more-source\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>Name:</b> {{ layer.source.name | default:\"Not specified\" }}</span><br>\n            <span><b>Attribution:</b> {{ layer.source.attribution | default:\"Not specified\" }}</span><br>\n            <span><b>URL:</b> {{ layer.source.url | default:\"Not specified\" }}</span><br>\n          </div>\n          <div\n            ng-if=\"layer.wms\"\n            id=\"modal-layer-more-wms\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>URL:</b> {{ layer.wms.url | default:\"Not specified\" }}</span><br>\n            <span><b>Layers:</b> {{ layer.wms.layers|join:\', \'|default:\"Not specified\" }}</span><br>\n            <span><b>Styles:</b> {{ layer.wms.styles|join:\', \'|default:\"Not specified\" }}</span><br>\n            <span><b>Format:</b> {{ layer.wms.format | default:\"Not specified\" }}</span><br>\n            <span><b>Version:</b> {{ layer.wms.version | default:\"Not specified\" }}</span><br>\n            <span><b>Transparent:</b> {{ layer.wms.transparent | default:\"No\" }}</span><br>\n            <hr>\n            <span><a target=\"_blank\" href=\"{{ layer.wms.url }}?SERVICE=WMS&Request=GetCapabilities\">Capabilities</a><br>\n            <span><a target=\"_blank\" href=\"{{ layer.wms.url }}?SERVICE=WMS&Request=GetLegendGraphic&format=image/png&layer={{ layer.wms.layers|first }}\">Legend Graphic</a><br>\n          </div>\n          <div\n            ng-if=\"layer.wfs\"\n            id=\"modal-layer-more-wfs\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>URL:</b> {{ layer.wfs.url | default:\"Not specified\" }}</span><br>\n            <span><b>Version:</b> {{ layer.wfs.version | default:\"Not specified\" }}</span><br>\n            <hr>\n            <span><a target=\"_blank\" href=\"{{ layer | url_describefeaturetype }}\">Describe Feature Type</a><br>\n          </div>\n          <div\n            ng-if=\"layer.wfs\"\n            id=\"modal-layer-more-download\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span><b>Download Shapefile</b>: <a target=\"_blank\" href=\"{{ layer | url_shapefile }}\">All</a>, <a target=\"_blank\" href=\"{{ layer | url_shapefile:state }}\">Current Extent</a><br>\n            <span><b>Download GeoJSON</b>: <a target=\"_blank\" href=\"{{ layer | url_geojson }}\">All</a>, <a target=\"_blank\" href=\"{{ layer | url_geojson:state }}\">Current Extent</a><br>\n            <span><b>Download Google Earth KML</b>: <a target=\"_blank\" href=\"{{ layer | url_kml }}\">All</a>, <a target=\"_blank\" href=\"{{ layer | url_kml:state }}\">Current Extent</a><br>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_layer_config.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">Layer / {{ layer.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li class=\"active\" role=\"presentation\">\n            <a href=\"#modal-layer-config-input\"\n              aria-controls=\"modal-layer-config-input\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Configure</a>\n          </li>\n          <li class=\"\" role=\"presentation\">\n            <a href=\"#modal-layer-config-output\"\n              aria-controls=\"modal-layer-config-output\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Output</a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-layer-config-input\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <div class=\"form-group row\" style=\"margin:0; padding-top: 10px; padding-bottom: 10px;\">\n              <div class=\"col-md-3\"><h5>Title</h5></div>\n              <div class=\"col-md-9\">\n                <label for=\"layer-config-title\" class=\"sr-only control-label\">Title</label>\n                <input\n                  id=\"layer-config-title\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  placeholder=\"Title ...\"\n                  data-geosite-field-type=\"text\"\n                  ng-model=\"layer.title\"\n                  ng-change=\"validateField()\"\n                  required\n                  value=\"{{ layer.title }}\">\n              </div>\n            </div>\n            <div class=\"form-group row\" style=\"margin:0; padding-top: 10px; padding-bottom: 10px;\">\n              <div class=\"col-md-3\"><h5>Description</h5></div>\n              <div class=\"col-md-9\">\n                <label for=\"layer-config-title\" class=\"sr-only control-label\">Description</label>\n                <input\n                  id=\"layer-config-description\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  placeholder=\"Title ...\"\n                  data-geosite-field-type=\"text\"\n                  ng-model=\"layer.description\"\n                  ng-change=\"validateField()\"\n                  required\n                  value=\"{{ layer.Description }}\">\n              </div>\n            </div>\n          </div>\n          <div\n            id=\"modal-layer-config-output\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            {{ layer | json }}\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["symbol_circle.tpl.html"] = "<div>\n  <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n    <circle\n      cx=\"50%\"\n      cy=\"50%\"\n      ng-r=\"{{ style.legend.symbol.radius }}\"\n      ng-fill=\"{{ style.styles.default.static.color }}\"\n      stroke-width=\"1\"\n      stroke=\"#000000\"></circle>\n  </svg>\n</div>\n";
geosite.templates["symbol_ellipse.tpl.html"] = "<div>\n  <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n    <ellipse\n      cx=\"50%\"\n      cy=\"50%\"\n      ng-rx=\"{{ style.legend.symbol.width }}\"\n      ng-ry=\"{{ style.legend.symbol.height }}\"\n      ng-fill=\"{{ style.styles.default.static.color }}\"\n      stroke-width=\"1\"\n      stroke=\"#000000\"></circle>\n  </svg>\n</div>\n";
geosite.templates["symbol_graduated.tpl.html"] = "<div>\n  <div\n    style=\"display: inline-block; vertical-align:top;\"\n    ng-bind-html=\"style.ramp.label.left | md2html\"></div>\n  <svg\n    ng-attr-width=\"{{ containerWidth }}\"\n    height=\"90px\"\n    version=\"1.0\"\n    xmlns=\"http://www.w3.org/2000/svg\">\n    <g>\n      <rect\n        ng-repeat=\"color in style.colors.ramp track by $index\"\n        ng-attr-x=\"{{ style.colors.ramp | length | position_x : $index : containerWidth : 26 }}px\"\n        ng-attr-y=\"{{ \'0\' }}\"\n        ng-attr-width=\"{{ style.colors.ramp | length | width_x : containerWidth : 26 }}px\"\n        height=\"50px\"\n        ng-attr-fill=\"{{ color }}\"\n        stroke-width=\"1\"\n        stroke=\"#000000\"/>\n    </g>\n    <g>\n      <text\n        ng-repeat=\"breakpoint in style | breakpoints track by $index\"\n        ng-attr-x=\"{{ style | breakpoints | length | add: -1 | position_x : $index : containerWidth : 26 }}px\"\n        ng-attr-y=\"{{ $index | choose : 68 : 82 }}px\"\n        text-anchor=\"middle\"\n        ng-attr-fill=\"{{ \'black\' }}\"\n        font-size=\"14px\"\n        text-decoration=\"underline\"\n        font-family=\"\'Open Sans\', sans-serif\">{{ style | breakpoint: $index | formatBreakpoint }}</text>\n    </g>\n  </svg>\n  <div\n    style=\"display: inline-block; vertical-align:top;\"\n    ng-bind-html=\"style.ramp.label.right | md2html\"></div>\n</div>\n";
geosite.templates["symbol_graphic.tpl.html"] = "<i class=\"fa fa-image\" style=\"color:black; font-size: 20px;\"></i>\n";
geosite.templates["legend_baselayers.tpl.html"] = "<div class=\"geosite-map-legend-baselayers geosite-radio-group\">\n  <div\n    ng-repeat=\"layer in map_config.baselayers track by $index\"\n    ng-if=\"layer.legend!==undefined\"\n    class=\"geosite-map-legend-item noselect\"\n    data-layer=\"{{ layer.id }}\">\n    <div class=\"geosite-map-legend-item-left\">\n      <div class=\"geosite-map-legend-item-icon geosite-map-legend-item-more\">\n        <a\n          class=\"geosite-intent\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{&quot;id&quot;:&quot;geosite-modal-layer-more&quot;,&quot;dynamic&quot;:{&quot;layer&quot;:[&quot;map_config&quot;,&quot;baselayers&quot;,&quot;{{ $index }}&quot;]}}\"\n          data-intent-ctrl=\"geosite-map-legend\">\n          <i class=\"fa fa-info-circle\"></i>\n        </a>\n      </div><!--\n      --><div class=\"geosite-map-legend-item-icon geosite-map-legend-item-visibility\">\n           <a\n             ng-class=\" $first ? \'geosite-map-legend-item-visibility-button geosite-intent geosite-radio geosite-on\' : \'geosite-map-legend-item-visibility-button geosite-intent geosite-radio\'\"\n             data-intent-name=\"switchBaseLayer\"\n             data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.id }}&quot;}\"\n             data-intent-class-on=\"geosite-on\"\n             data-intent-class-off=\"\"\n             data-intent-ctrl=\"geosite-map-legend\">\n             <i class=\"fa fa-eye geosite-on\"></i><i class=\"fa fa-eye-slash geosite-off\"></i>\n           </a>\n         </div><!--\n      --><div class=\"geosite-map-legend-item-symbol\" style=\"width: 10px;\"></div>\n    </div><!--\n    --><div class=\"geosite-map-legend-item-right\">\n      <div\n        class=\"geosite-map-legend-item-label\"\n        style=\"{{ layer.id | layer_is_visible : state | ternary : \'width: 100%;\' : \'width: 100%;opacity: 0.4;\' }}\">\n        <span ng-bind-html=\"layer.legend.label | md2html\"></span>\n      </div>\n    </div>\n  </div>\n</div>\n";
geosite.templates["legend_featurelayers.tpl.html"] = "<div class=\"geosite-map-legend-featurelayers\">\n  <div\n    ng-repeat=\"layer in featurelayers track by $index\"\n    ng-init=\"layerIndex = $index\"\n    ng-if=\"layer.item.legend!==undefined\"\n    class=\"geosite-map-legend-item noselect\"\n    data-layer=\"{{ layer.key }}\">\n    <div class=\"geosite-map-legend-item-left\">\n      <div class=\"geosite-map-legend-item-icon geosite-map-legend-item-config\" style=\"display:none;\">\n        <a\n          class=\"geosite-intent\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{&quot;id&quot;:&quot;geosite-modal-layer-config&quot;,&quot;static&quot;:{&quot;layerID&quot;:&quot;{{ layer.key }}&quot;},&quot;dynamic&quot;:{&quot;layer&quot;:[&quot;map_config&quot;,&quot;featurelayers&quot;,&quot;{{ layer.key }}&quot;]}}\"\n          data-intent-ctrl=\"geosite-map-legend\">\n          <i class=\"fa fa-cog\"></i>\n        </a>\n      </div><!--\n      --><div class=\"geosite-map-legend-item-icon geosite-map-legend-item-more\">\n        <a\n          class=\"geosite-intent\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{&quot;id&quot;:&quot;geosite-modal-layer-more&quot;,&quot;static&quot;:{&quot;layerID&quot;:&quot;{{ layer.key }}&quot;},&quot;dynamic&quot;:{&quot;layer&quot;:[&quot;map_config&quot;,&quot;featurelayers&quot;,&quot;{{ layer.key }}&quot;]}}\"\n          data-intent-ctrl=\"geosite-map-legend\">\n          <i class=\"fa fa-info-circle\"></i>\n        </a>\n      </div><!--\n      --><div class=\"geosite-map-legend-item-icon geosite-map-legend-item-visibility\">\n         <a\n           ng-class=\"(layer.item.visible != undefined ? layer.item.visible : true ) ? \'geosite-map-legend-item-visibility-button geosite-intent geosite-toggle\' : \'geosite-map-legend-item-visibility-button geosite-intent geosite-toggle geosite-off\'\"\n           data-intent-names=\"[&quot;showLayer&quot;,&quot;hideLayer&quot;]\"\n           data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.key }}&quot;}\"\n           data-intent-ctrl=\"geosite-map-legend\">\n           <i class=\"fa fa-eye geosite-on\"></i><i class=\"fa fa-eye-slash geosite-off\"></i>\n         </a>\n     </div><!--\n     --><div\n          ng-class=\"layer.item.type == \'geojson\' ? \'geosite-map-legend-item-icon geosite-map-legend-item-zoomto\': \'geosite-map-legend-item-icon geosite-map-legend-item-zoomto fade disabled\'\">\n        <a\n          class=\"geosite-map-legend-item-zoomto-button geosite-intent\"\n          data-intent-name=\"zoomToLayer\"\n          data-intent-data=\"{&quot;layer&quot;:&quot;{{ layer.key }}&quot;}\"\n          data-intent-ctrl=\"geosite-map-legend\">\n          <i class=\"fa fa-compress\"></i>\n        </a>\n      </div>\n    </div><!--\n    --><div class=\"geosite-map-legend-item-right\">\n      <div\n        ng-if=\"layer.item.cartography[0].legend.symbol\"\n        class=\"geosite-map-legend-item-symbol\">\n        <a\n          class=\"geosite-intent\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{&quot;id&quot;:&quot;geosite-modal-layer-carto&quot;,&quot;static&quot;:{&quot;layerID&quot;:&quot;{{ layer.key }}&quot;},&quot;dynamic&quot;:{&quot;layer&quot;:[&quot;map_config&quot;,&quot;featurelayers&quot;,&quot;{{ layer.key }}&quot;]}}\"\n          data-intent-ctrl=\"geosite-map-legend\">\n          <div ng-if=\"layer.item.cartography[0].legend.symbol.type == \'circle\'\">\n            <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n              <circle\n                cx=\"50%\"\n                cy=\"50%\"\n                ng-r=\"{{ layer.item.cartography[0].legend.symbol.radius }}\"\n                ng-fill=\"{{ layer.item.cartography[0].styles.default.static.color }}\"\n                stroke-width=\"1\"\n                stroke=\"#000000\"></circle>\n            </svg>\n          </div>\n          <div ng-if=\"layer.item.cartography[0].legend.symbol.type == \'ellipse\'\">\n            <svg width=\"100%\" height=\"100%\" version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\">\n              <ellipse\n                cx=\"50%\"\n                cy=\"50%\"\n                ng-rx=\"{{ layer.item.cartography[0].legend.symbol.width }}\"\n                ng-ry=\"{{ layer.item.cartography[0].legend.symbol.height }}\"\n                ng-fill=\"{{ layer.item.cartography[0].styles.default.static.color }}\"\n                stroke-width=\"1\"\n                stroke=\"#000000\"></circle>\n            </svg>\n          </div>\n          <div\n            ng-if=\"layer.item.cartography[0].legend.symbol.type == \'graduated\'\">\n            <svg\n              ng-attr-width=\"{{ layer.item.cartography[0].legend.symbol.width }}\"\n              height=\"100%\"\n              version=\"1.0\"\n              xmlns=\"http://www.w3.org/2000/svg\">\n              <rect\n                ng-repeat=\"color in layer.item.cartography[0].colors.ramp track by $index\"\n                ng-attr-x=\"{{ $index|percent:layer.item.cartography[0].colors.ramp.length }}%\"\n                y=\"0\"\n                ng-attr-width=\"{{ 1|percent:layer.item.cartography[0].colors.ramp.length }}%\"\n                ng-attr-height=\"{{ layer.item.cartography[0].legend.symbol.height }}\"\n                ng-attr-fill=\"{{ color }}\"\n                stroke-width=\"1\"\n                stroke=\"#000000\"/>\n            </svg>\n          </div>\n          <div\n            ng-if=\"layer.item.cartography[0].legend.symbol.type == \'graphic\'\">\n            <i class=\"fa fa-image\" style=\"color:black; font-size: 20px;\"></i>\n          </div>\n        </a>\n      </div><!--\n      --><div\n           class=\"geosite-map-legend-item-label\"\n           style=\"{{ layer.key | layer_is_visible : state | ternary : \'\' : \'opacity: 0.4;\' }}\">\n        <span ng-bind-html=\"layer.item.legend.label | md2html\"></span>\n      </div>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_welcome.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ welcome.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li role=\"presentation\" class=\"active\">\n            <a\n              href=\"#modal-welcome-general\"\n              aria-controls=\"modal-welcome-general\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">General</a>\n          </li>\n          <li role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-welcome-about\"\n              aria-controls=\"modal-welcome-about\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">About</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-welcome-general\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"welcome.general | md2html | default:\'No body given.\'\"></span>\n          </div>\n          <div\n            id=\"modal-welcome-about\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"welcome.about | md2html | default:\'No body given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_about.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ about.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"pane in about.panes track by $index\">\n            <a\n              href=\"#{{ pane.id }}\"\n              aria-controls=\"{{ pane.id }}\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"pane.tab.label | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"pane in about.panes track by $index\"\n            id=\"{{ pane.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"pane.content | md2html | default:\'No content given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_download.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ download.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li\n            role=\"presentation\"\n            ng-class=\"$first ? \'active\' : \'\'\"\n            ng-repeat=\"pane in download.panes track by $index\">\n            <a\n              href=\"#{{ pane.id }}\"\n              aria-controls=\"{{ pane.id }}\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\"\n              ng-bind-html=\"pane.tab.label | default:\'Default\' | tabLabel\"></a>\n          </li>\n        </ul>\n        <!-- Tab panes -->\n        <div class=\"tab-content\">\n          <div\n            ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n            ng-repeat=\"pane in download.panes track by $index\"\n            id=\"{{ pane.id }}\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"pane.content | md2html | default:\'No content given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";
geosite.templates["modal_welcome_geositeserver.tpl.html"] = "<div class=\"modal-dialog\" data-backdrop=\"static\" role=\"document\">\n  <div class=\"modal-content\">\n    <div class=\"modal-header\">\n      <h4 class=\"modal-title\" id=\"myModalLabel\">{{ welcome.title }}</h4>\n    </div>\n    <div class=\"modal-body\">\n      <div>\n        <!-- Nav tabs -->\n        <ul class=\"nav nav-tabs\" role=\"tablist\">\n          <li role=\"presentation\" class=\"active\">\n            <a\n              href=\"#modal-welcome-intro\"\n              aria-controls=\"modal-welcome-intro\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">Introduction</a>\n          </li>\n          <li role=\"presentation\" class=\"\">\n            <a\n              href=\"#modal-welcome-about\"\n              aria-controls=\"modal-welcome-about\"\n              role=\"tab\"\n              data-toggle=\"tab\"\n              style=\"padding-left:8px; padding-right: 8px;\">About</a>\n          </li>\n        </ul>\n        <div class=\"tab-content\">\n          <div\n            id=\"modal-welcome-intro\"\n            class=\"tab-pane fade in active\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span\n              class=\"welcome-body\"\n              ng-bind-html=\"welcome.intro | md2html | default:\'No body given.\'\"></span>\n            <hr>\n            <h3 class=\"welcome-body\">Get Started: Select a dashboard!</h3>\n            <div class=\"input-group select2-bootstrap-prepend select2-bootstrap-append\">\n              <input\n                id=\"dashboard-input-backend\"\n                name=\"dashboard-input-backend\"\n                type=\"text\"\n                class=\"form-control\"\n                style=\"display:none;\"\n                ng-model=\"dashboard\">\n              <span class=\"input-group-addon\" id=\"dashboard-addon\">Dashboard</span>\n              <input\n                id=\"dashboard-input\"\n                name=\"dashboard-input\"\n                type=\"text\"\n                class=\"typeahead form-control\"\n                style=\"width:400px; height: auto;\"\n                placeholder=\"dashboard (e.g., CAR Operation, GIS Presence, WFP Facilities, etc.)\"\n                aria-describedby=\"dashboard-addon\"\n                data-placeholder=\"dashboard (e.g., CAR Operation, GIS Presence, WFP Facilities, etc.)\"\n                data-initial-data=\"dashboards_typeahead\"\n                data-backend=\"dashboard-input-backend\"\n                data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find dashboard</div>\">\n                <div class=\"input-group-addon btn btn-danger btn-clear\" data-clear=\"#dashboard-input\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n            </div>\n            <hr>\n            <ul class=\"nav nav-justified welcome-go\">\n              <li>\n                <a\n                  ng-disabled=\"dashboard == undefined || dashboard == \'\'\"\n                  ng-class=\"dashboard == undefined || dashboard == \'\'  ? \'btn btn-default\' : \'btn btn-primary\' \"\n                  ng-href=\"{{ dashboard == undefined || dashboard == \'\' ? \'#\' : \'/dashboard/\'+dashboard }}\">Go!</a>\n              </li>\n            </ul>\n          </div>\n          <div\n            id=\"modal-welcome-about\"\n            class=\"tab-pane fade\"\n            role=\"tabpanel\"\n            style=\"padding: 10px;\">\n            <span ng-bind-html=\"welcome.about | md2html | default:\'No body given.\'\"></span>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>\n";
geosite.templates["dashboard_editor.tpl.html"] = "<div class=\"geosite-dashboard-editor\">\n  <h3 style=\"word-wrap:break-word;text-align:center;\">Editor</h3>\n  <hr>\n  <form novalidate class=\"form-horizontal simple-form\">\n    <ul class=\"nav nav-tabs nav-justified\" role=\"tablist\">\n      <li\n        ng-repeat=\"pane in editor.panes track by $index\"\n        ng-init=\"paneIndex = $index\"\n        role=\"presentation\"\n        ng-class=\"$first ? \'active\' : \'\'\">\n        <a\n          href=\"#{{ pane.id }}\"\n          aria-controls=\"{{ pane.id }}\"\n          role=\"tab\"\n          data-toggle=\"tab\"\n          style=\"padding-left:8px; padding-right: 8px; height: 62px;\"\n          ng-bind-html=\" pane.label | md2html\"></a>\n      </li>\n    </ul>\n    <div class=\"tab-content\">\n      <div\n        ng-class=\"$first ? \'tab-pane fade in active\' : \'tab-pane fade\'\"\n        ng-repeat=\"pane in fields_by_pane track by $index\"\n        ng-init=\"paneIndex = $index\"\n        id=\"{{ pane.id }}\"\n        role=\"tabpanel\"\n        style=\"padding: 10px;\">\n        <div\n          ng-repeat=\"field in pane.fields track by $index\"\n          ng-init=\"field_flat = (field | replace : \'.\' : \'__\')\"\n          ng-init=\"fieldIndex = $index\"\n          class=\"form-group\"\n          style=\"margin:0; padding-top: 10px; padding-bottom: 10px;\">\n          <div\n            ng-if=\"map_config_schema | extract : field : \'type\' | inArray: [\'text\', \'string\', \'markdown\', \'md\']\">\n            <div class=\"col-md-3\"><h5>{{ map_config_schema | extract : field : \'label\' }}</h5></div>\n            <div class=\"col-md-9\">\n              <label for=\"editor-field-{{ field | replace : \'.\' : \'__\' }}\" class=\"sr-only control-label\" ng-bind-html=\"map_config_schema | extract : field : \'label\'\"></label>\n                <div\n                  ng-if=\"map_config_schema | extract : field : \'multiline\' | default_if_undefined: \'false\' | inArray: [false, \'false\', \'no\', 0]\"\n                  class=\"input-group\">\n                  <input\n                    id=\"editor-field-{{ field | replace : \'.\' : \'__\' }}\"\n                    name=\"editor-field-{{ field | replace : \'.\' : \'__\' }}\"\n                    type=\"text\"\n                    class=\"form-control\"\n                    placeholder=\"{{ map_config_schema | extract : field : \'placeholder\' }}\"\n                    data-geosite-field-type=\"{{ map_config_schema | extract : field : \'type\' }}\"\n                    ng-required=\"map_config_schema | extract : field : \'required\'\"\n                    ng-value=\"map_config_flat | extract : field_flat\"\n                    ng-model=\"map_config_flat[field_flat]\"\n                    ng-change=\"validateField(field_flat)\">\n                  <a\n                    class=\"geosite-intent input-group-addon btn btn-primary btn-edit\"\n                    href=\"#\"\n                    data-intent-name=\"toggleModal\"\n                    data-intent-data=\"{&quot;id&quot;:&quot;geosite-modal-edit-field&quot;,&quot;static&quot;:{&quot;field&quot;:&quot;{{ field }}&quot;,&quot;field_flat&quot;:&quot;{{ field_flat }}&quot;},&quot;dynamic&quot;:{&quot;value_edit_field&quot;:[&quot;source&quot;,&quot;map_config_flat&quot;,&quot;{{ field_flat }}&quot;],&quot;map_config_schema&quot;:[&quot;source&quot;,&quot;map_config_schema&quot;],&quot;map_config_schema_flat&quot;:[&quot;source&quot;,&quot;map_config_schema_flat&quot;]}}\"\n                    data-intent-ctrl=\"geosite-sidebar-right\">\n                    <i class=\"fa fa-pencil-square-o \"></i>\n                  </a>\n                  <div\n                    class=\"input-group-addon btn btn-danger btn-clear\"\n                    data-clear=\"#editor-field-{{ field | replace : \'.\' : \'__\' }}\">\n                    <i class=\"fa fa-times\"></i>\n                  </div>\n              </div>\n              <div\n                ng-if=\"map_config_schema | extract : field : \'multiline\' | default_if_undefined: \'false\' | inArray: [true, \'true\', \'yes\', 1]\"\n                class=\"input-group\">\n                <textarea\n                  id=\"editor-field-{{ field | replace : \'.\' : \'__\' }}\"\n                  name=\"editor-field-{{ field | replace : \'.\' : \'__\' }}\"\n                  class=\"form-control\"\n                  placeholder=\"{{ map_config_schema | extract : field : \'placeholder\' }}\"\n                  rows=\"5\"\n                  data-geosite-field-type=\"{{ map_config_schema | extract : field : \'type\' }}\"\n                  ng-required=\"map_config_schema | extract : field : \'required\'\"\n                  style=\"max-width: 100%;\"\n                  ng-model=\"map_config_flat[field_flat]\"\n                  ng-change=\"validateField(field_flat)\"\n                  ng-bind-html=\"map_config_flat | extract : field_flat\"></textarea>\n                <a\n                  class=\"geosite-intent input-group-addon btn btn-primary btn-edit\"\n                  href=\"#\"\n                  data-intent-name=\"toggleModal\"\n                  data-intent-data=\"{&quot;id&quot;:&quot;geosite-modal-edit-field&quot;,&quot;static&quot;:{&quot;field&quot;:&quot;{{ field }}&quot;,&quot;field_flat&quot;:&quot;{{ field_flat }}&quot;},&quot;dynamic&quot;:{&quot;value_edit_field&quot;:[&quot;source&quot;,&quot;map_config_flat&quot;,&quot;{{ field_flat }}&quot;],&quot;map_config_schema&quot;:[&quot;source&quot;,&quot;map_config_schema&quot;],&quot;map_config_schema_flat&quot;:[&quot;source&quot;,&quot;map_config_schema_flat&quot;]}}\"\n                  data-intent-ctrl=\"geosite-sidebar-right\">\n                  <i class=\"fa fa-pencil-square-o \"></i>\n                </a>\n                <div\n                  class=\"input-group-addon btn btn-danger btn-clear\"\n                  data-clear=\"#editor-field-{{ field | replace : \'.\' : \'__\' }}\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n              </div>\n            </div>\n            <div ng-show=\"form.$submitted || form.{{ field }}.$touched\">\n              <span ng-show=\"form.{{ field }}.$error.required\">{{ map_config_schema | extract : field : \'label\' }} is required.</span>\n            </div>\n          </div>\n          <div\n            ng-if=\"map_config_schema | extract : field : \'type\' | inArray: [\'int\', \'integer\']\">\n            <div class=\"col-md-3\"><h5>{{ map_config_schema | extract : field : \'label\' }}</h5></div>\n            <div class=\"col-md-9\">\n              <label for=\"editor-field-{{ field }}\" class=\"sr-only control-label\" ng-bind-html=\"map_config_schema | extract : field : \'label\'\"></label>\n              <div class=\"input-group\">\n                <input\n                  id=\"editor-field-{{ field_flat }}\"\n                  name=\"editor-field-{{ field_flat }}\"\n                  type=\"number\"\n                  class=\"form-control\"\n                  placeholder=\"{{ map_config_schema | extract : field : \'placeholder\' }}\"\n                  data-geosite-field-type=\"{{ map_config_schema | extract : field : \'type\' }}\"\n                  ng-required=\"map_config_schema | extract : field : \'required\'\"\n                  ng-attr-min=\"{{ map_config_schema | extract : field : \'minValue\' | default_if_undefined: \'\' }}\"\n                  ng-attr-max=\"{{ map_config_schema | extract : field : \'maxValue\' | default_if_undefined: \'\' }}\"\n                  ng-value=\"map_config_flat | extract : field_flat\"\n                  ng-model=\"map_config_flat[field_flat]\"\n                  ng-change=\"validateField(field_flat)\">\n                <div\n                  class=\"input-group-addon btn btn-danger btn-clear\"\n                  data-clear=\"#editor-field-{{ field_flat }}\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n              </div>\n            </div>\n            <div ng-show=\"form.$submitted || form.{{ field }}.$touched\">\n              <span ng-show=\"form.{{ field }}.$error.required\">{{ map_config_schema | extract : field : \'label\' }} is required.</span>\n            </div>\n          </div>\n          <div\n            ng-if=\"map_config_schema | extract : field : \'type\' | inArray: [\'boolean\', \'checkbox\']\"\n            class=\"col-sm-offset-2 col-sm-10\">\n            <div class=\"checkbox\">\n              <label>\n                <input\n                  type=\"checkbox\"\n                  ng-checked=\"map_config | extract : field\"> {{ map_config_schema | extract : field : \'label\' }}\n              </label>\n            </div>\n          </div>\n          <div\n            ng-if=\"map_config_schema | extract : field : \'type\' | inArray: [\'stringarray\', \'textarray\']\"\n            class=\"col-sm-offset-2 col-sm-10\">\n            <div\n              id=\"editor-field-{{ field_flat }}-label\"\n              class=\"col-md-3\"><h5>{{ map_config_schema | extract : field : \'label\' }}</h5></div>\n            <div\n              class=\"col-md-9\"\n              ng-bind-html=\"map_config | extract : field | formatArray\">\n              <div class=\"input-group\">\n                <input\n                  id=\"editor-field-{{ field_flat }}-backend\"\n                  name=\"editor-field-{{ field_flat }}-backend\"\n                  type=\"text\"\n                  class=\"form-control\"\n                  style=\"display:none;\"\n                  ng-value=\"map_config_flat | extract : field_flat\"\n                  ng-model=\"map_config_flat[field_flat]\"\n                  ng-change=\"validateField(field_flat)\">\n                <input\n                  id=\"editor-field-{{ field_flat }}\"\n                  name=\"editor-field-{{ field_flat }}\"\n                  type=\"text\"\n                  class=\"typeahead form-control\"\n                  style=\"width:400px; height: auto;\"\n                  placeholder=\"{{ map_config_schema | extract : field : \'placeholder\' }}\"\n                  data-placeholder=\"{{ map_config_schema | extract : field : \'placeholder\' }}\"\n                  data-geosite-field-type=\"{{ map_config_schema | extract : field : \'type\' }}\"\n                  ng-required=\"map_config_schema | extract : field : \'required\'\"\n                  aria-describedby=\"editor-field-{{ field_flat }}-label\"\n                  data-initial-data=\"\"\n                  data-backend=\"editor-field-{{ field_flat }}-backend\"\n                  data-template-empty=\"<div class=&quot;alert alert-danger empty-message&quot;>Unable to find value</div>\">\n                <div\n                  class=\"input-group-addon btn btn-danger btn-clear\"\n                  data-clear=\"#editor-field-{{ field | replace : \'.\' : \'__\' }}\">\n                  <i class=\"fa fa-times\"></i>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n    <hr>\n    <div class=\"form-group\">\n      <div class=\"col-sm-offset-2 col-sm-10\">\n        <button type=\"submit\" class=\"btn btn-primary\">Save</button>\n        <button type=\"submit\" class=\"btn btn-default\">Reset</button>\n        <a\n          class=\"geosite-intent btn btn-primary\"\n          data-intent-name=\"toggleModal\"\n          data-intent-data=\"{&quot;id&quot;:&quot;geosite-modal-dashboard-config&quot;,&quot;dynamic&quot;:{&quot;map_config&quot;:&quot;map_config&quot;}}\"\n          data-intent-ctrl=\"geosite-sidebar-right\">\n          <i class=\"fa fa-code\"></i>\n        </a>\n      </div>\n    </div>\n  </form>\n</div>\n";
geosite.templates["modal_edit_field.tpl.html"] = "<div class=\"modal-dialog\" role=\"document\">\n  <div\n    ng-if=\"field_flat | default_if_undefined: false\"\n    class=\"modal-content\">\n    <div class=\"modal-header\">\n      <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\"><i class=\"fa fa-times\"></i></button>\n      <h4\n        id=\"myModalLabel\"\n        class=\"modal-title\"\n        ng-bind-html=\"map_config_schema | extract : field : \'label\' | prepend : \'Edit / \' | md2html\"></h4>\n    </div>\n    <div class=\"modal-body\">\n      <ul class=\"nav nav-tabs nav-justified\" role=\"tablist\">\n        <li role=\"presentation\" class=\"active\">\n          <a\n            href=\"#modal-edit-field-pane-input\"\n            aria-controls=\"modal-edit-field-pane-input\"\n            role=\"tab\"\n            data-toggle=\"tab\"\n            style=\"padding-left:8px; padding-right: 8px; height: 62px;\">Input</a>\n        </li>\n        <li role=\"presentation\" class=\"\">\n          <a\n            href=\"#modal-edit-field-pane-preview\"\n            aria-controls=\"modal-edit-field-pane-preview\"\n            role=\"tab\"\n            data-toggle=\"tab\"\n            style=\"padding-left:8px; padding-right: 8px; height: 62px;\">Preview</a>\n        </li>\n      </ul>\n      <div class=\"tab-content\">\n        <div\n          id=\"modal-edit-field-pane-input\"\n          role=\"tabpanel\"\n          class=\"tab-pane fade\"\n          style=\"padding: 10px;\">\n          <textarea\n            id=\"modal-edit-field-{{ field_flat }}\"\n            name=\"modal-edit-field-{{ field_flat }}\"\n            class=\"form-control\"\n            placeholder=\"{{ map_config_schema | extract : field : \'placeholder\' }}\"\n            rows=\"15\"\n            data-geosite-field-type=\"{{ map_config_schema | extract : field : \'type\' }}\"\n            ng-required=\"map_config_schema | extract : field : \'required\'\"\n            style=\"max-width: 100%;\"\n            ng-model=\"value_edit_field\"\n            ng-change=\"validateModalField(field_flat)\"></textarea>\n        </div>\n        <div\n          id=\"modal-edit-field-pane-preview\"\n          role=\"tabpanel\"\n          class=\"tab-pane fade\"\n          style=\"padding: 10px;\">\n          <pre\n            style=\"word-wrap: break-word; white-space: pre-wrap;\"\n            ng-bind-html=\"value_edit_field | md2html\"\n          ></pre>\n        </div>\n      </div>\n      <hr>\n      <div\n        class=\"btn btn-danger btn-clear\"\n        data-clear=\"#modal-edit-field-{{ field_flat }}, #editor-field-{{ field_flat }}\">\n        <i class=\"fa fa-times\"></i>\n      </div>\n    </div>\n    <div class=\"modal-footer\">\n      <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button>\n    </div>\n  </div>\n</div>\n";

var MONTHS_NUM = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
//Array(12).fill().map((x,i)=>i)

var MONTHS_LONG =[
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"];

var MONTHS_SHORT3 =
[
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec"];

var MONTHS_ALL = $.map(MONTHS_NUM, function(num, i){
  return {
    'num': num,
    'short3': MONTHS_SHORT3[i],
    'long': MONTHS_LONG[i]
  };
});

var DAYSOFTHEWEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'];

geosite.filters["default"] = function()
{
  return function(value, fallback)
  {
    return value || fallback;
  };
};

geosite.filters["join"] = function()
{
    return function(array, arg)
    {
        if (Array.isArray(array))
        {
            return array.join(arg);
        }
        else
        {
            return array;
        }
    };
};

geosite.filters["first"] = function()
{
    return function(array)
    {
        if (!Array.isArray(array))
        {
            return array;
        }
        return array[0];
    };
};

geosite.filters["last"] = function()
{
    return function(arr)
    {
        if (!Array.isArray(arr))
        {
            return arr;
        }

        if(arr.length == 0)
        {
            return undefined;
        }

        return arr[arr.length - 1];
    };
};

geosite.filters["formatInteger"] = function()
{
  return function(value, type, delimiter)
  {
    if(value != undefined && value !== "")
    {
      if(type == "delimited")
      {
        delimiter = delimiter || ',';
        var str = Math.round(value).toString(); // Round in case value is a float
        var pattern = new RegExp('(\\d+)(\\d{3})','gi');
        while(pattern.test(str)){str=str.replace(pattern,'$1'+ delimiter +'$2');}
        return str;
      }
      else
      {
        return Math.round(value).toString();
      }
    }
    else
    {
        return "";
    }
  };
};

geosite.filters["formatArray"] = function()
{
  return function(arr)
  {
      if(Array.isArray(arr))
      {
        if(arr.length == 0)
        {
          return "";
        }
        else if(arr.length == 1)
        {
          return arr[0];
        }
        else if(arr.length == 2)
        {
          return arr.join(" and ");
        }
        else // greater than 2
        {
          return arr.slice(0,-1).join(", ")+", and "+arr[arr.length - 1];
        }
      }
      else
      {
          return arr;
      }
  };
};

geosite.filters["formatMonth"] = function()
{
  return function(value, type)
  {
    if(value != undefined && value !== "")
    {
      if(type == "long")
      {
        return months_long[value-1];
      }
      else if(type == "short3" || type == "short_3")
      {
        return months_short_3[value-1];
      }
      else if(type == "int2")
      {
        return value < 10 ? ('0'+ value.toString()) : value.toString();
      }
      else
      {
        return value.toString();
      }
    }
    else
    {
      return ""
    }
  };
};

geosite.filters["md2html"] = function()
{
  return function(text)
  {
    if(text != undefined)
    {
      var converter = new showdown.Converter();
      html = converter.makeHtml(text);
      // Remove Prefix/Suffix Paragraph Tags
      html = html.substring("<p>".length, html.length - "</p>".length);
      // Open Links in New Windows
      var pattern = new RegExp("(<a .*)>(.*?)</a>", "gi");
      html = html.replace(pattern, '$1 target="_blank">$2</a>');
      // Replace New Line characters with Line Breaks
      html = html.replace(new RegExp('\n', 'gi'),'<br>');
      return html;
    }
    else
    {
      return "";
    }
  };
};

geosite.filters["percent"] = function()
{
  return function(value, denominator)
  {
    return 100.0 * value / denominator;
  };
};

geosite.filters["tabLabel"] = function()
{
  return function(value)
  {
    return value.split(" ").length == 2 ? value.replace(' ', '<br>') : value;
  };
};

geosite.filters["as_float"] = function()
{
  return function(value)
  {
    return 1.0 * value;
  };
};

geosite.filters["choose"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(arg))
    {
      var arr = arg;
      return value + arr[value % arr.length];
    }
    else
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return arr[value % arr.length];
    }
  };
};

geosite.filters["add"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(arg))
    {
      var arr = arg;
      return value + arr[value % arr.length];
    }
    else if(arguments.length > 2)
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return value + arr[value % arr.length];
    }
    else
    {
      return value + arg;
    }
  };
};

geosite.filters["default_if_undefined"] = function()
{
  return function(value, fallback)
  {
    if(value != undefined && value != null)
    {
      return value;
    }
    else
    {
      return fallback;
    }
  };
};

geosite.filters["title"] = function()
{
  return function(value)
  {
    return $.type(value) === "string" ? value.toTitleCase() : value;
  };
};

geosite.filters["as_array"] = function()
{
  return function(value)
  {
    if($.isArray(value))
    {
      return value;
    }
    else
    {
      return $.map(value, function(item, key){
        return {'key': key, 'item': item};
      });
    }
  };
};

geosite.filters["sortItemsByArray"] = function()
{
  return function(value, arg)
  {
    if($.isArray(value))
    {
      value = $.grep(value,function(x, i){
        return $.inArray(x["key"], arg) != -1;
      });
      value.sort(function(a, b){
        return $.inArray(a["key"], arg) - $.inArray(a["key"], arg);
      });
      return value;
    }
    else
    {
      return value;
    }
  };
};

geosite.filters["url_shapefile"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("wfs" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "format_options": "charset:UTF-8",
            "typename": typename,
            "outputFormat": "SHAPE-ZIP",
            "version": "1.0.0",
            "service": "WFS",
            "request": "GetFeature"
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geosite.filters["url_geojson"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("wfs" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "format_options": "charset:UTF-8",
            "typename": typename,
            "outputFormat": "json",
            "version": "1.0.0",
            "service": "WFS",
            "request": "GetFeature"
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geosite.filters["url_kml"] = function()
{
    return function(layer, state)
    {
        var url = "";
        if("kml" in layer)
        {
          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers[0];
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers[0];
          }
          var params = {
            "mode": "download",
            "layers": typename
          };
          if(state != undefined)
          {
            params["cql_filter"] = "BBOX("+layer.wfs.geometry+", "+state.view.extent+")";
          }
          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.kml.url + "?" + querystring;
        }
        return url;
    };
};

geosite.filters["url_describefeaturetype"] = function()
{
    return function(layer)
    {
        var url = "";
        if("wfs" in layer)
        {
          var version = layer.wfs.version || "1.0.0";
          var params = {
            "service": "WFS",
            "request": "DescribeFeatureType",
            "version": version,
            "outputFormat": "application/json"
          };

          var typename = "";
          if("layers" in layer.wms)
          {
            typename = layer.wms.layers.unique().join(",");
          }
          else if("layers" in layer.wfs)
          {
            typename = layer.wfs.layers.unique().join(",");
          }
          if(version == "1.1.0" || version == "1.0.0")
          {
            params["typeName"] = typename;
          }
          else
          {
            params["typeNames"] = typename;
          }

          var querystring = $.map(params, function(v, k){return encodeURIComponent(k) + '=' + encodeURIComponent(v);}).join("&");
          url = layer.wfs.url + "?" + querystring;
        }
        return url;
    };
};

geosite.filters["breakpoint"] = function()
{
    return function(style, index)
    {
      var breakpoints = geosite.breakpoints[style.styles.default.dynamic.options.breakpoints];
      if(breakpoints != undefined && breakpoints.length > 0)
      {
        return breakpoints[index];
      }
      else
      {
        return -1;
      }
    };
};

geosite.filters["breakpoints"] = function()
{
    return function(style)
    {
      var breakpoints = geosite.breakpoints[style.styles.default.dynamic.options.breakpoints];
      if(breakpoints != undefined && breakpoints.length > 0)
      {
        return breakpoints;
      }
      else
      {
        return [];
      }
    };
};

geosite.filters["formatBreakpoint"] = function()
{
    return function(value)
    {
      if(Number.isInteger(value))
      {
        return geosite.filters["formatInteger"]()(value, 'delimited', ' ');
      }
      else if($.isNumeric(value))
      {
        return geosite.filters["formatFloat"]()(value, 2);
      }
      else
      {
        return "" + value;
      }
    };
};

geosite.filters["formatFloat"] = function()
{
  return function(value, decimals)
  {
    if(value != undefined && value !== "")
    {
      if(decimals != undefined)
      {
        return value.toFixed(decimals);
      }
      else
      {
        return value.toString();
      }
    }
    else
    {
      return "";
    }
  };
};

geosite.filters["position_x"] = function()
{
    return function(domain, index, containerWidth, padding)
    {
      var parse_container_width = function(w)
      {
        return $.isNumeric(w) ? w : parseInt(w.substring(0, w.indexOf('px')), 10);
      };
      var actualWidth = parse_container_width(containerWidth) - (padding * 2);
      return padding + (actualWidth * index / domain);
    };
};

geosite.filters["width_x"] = function()
{
    return function(domain, containerWidth, padding)
    {
      var parse_container_width = function(w)
      {
        return $.isNumeric(w) ? w : parseInt(w.substring(0, w.indexOf('px')), 10);
      };
      var actualWidth = parse_container_width(containerWidth)  - (padding * 2);
      return actualWidth / domain;
    };
};

geosite.filters["len"] = geosite.filters["length"] = function()
{
  return function(value)
  {
    if($.isArray(value))
    {
      return value.length;
    }
    else
    {
      return 0;
    }
  };
};

geosite.filters["layer_is_visible"] = function()
{
  return function(layerID, state)
  {
    state = state || $("#geosite-main").scope().state;
    var visibleFeatureLayers = state.view.featurelayers;
    return (layerID == state.view.baselayer) || $.inArray(layerID, visibleFeatureLayers) != -1;
  };
};

geosite.filters["ternary"] = function()
{
  return function(value, t, f)
  {
    return value ? t : f;
  };
};

geosite.filters["extract"] = function()
{
  var _extract = function(keyChain, node)
  {
    var obj = undefined;
    if(keyChain.length==0)
    {
      obj = node;
    }
    else
    {
      if(node!=undefined)
      {
        var newKeyChain = keyChain.slice(1);
        var newNode = Array.isArray(node) ? node[keyChain[0]]: node[""+keyChain[0]];
        obj = extract(newKeyChain, newNode);
      }
    }
    return obj;
  };

  var _expand = function(arr)
  {
    var newArray = [];
    for(var i = 0; i < arr.length; i++)
    {
      var value = arr[i];
      if(value.indexOf(".") != -1)
      {
        newArray = newArray.concat(value.split("."));
      }
      else
      {
        newArray.push(value);
      }
    }
    return newArray;
  }

  return function(node)
  {
    var keyChain = Array.prototype.slice.call(arguments, [1]);
    if(keyChain.length > 0)
    {
      return _extract(_expand(keyChain), node);
    }
    else
    {
      return null;
    }
  };
};

geosite.filters["inArray"] = function()
{
  return function(value, arr)
  {
      if(Array.isArray(arr))
      {
        return arr.indexOf(value) != -1;
      }
      else
      {
        return false;
      }
  };
};

geosite.filters["yaml"] = function()
{
  return function(value)
  {
    if(value != undefined)
    {
      return YAML.stringify(value, 4);
    }
    else
    {
      return "";
    }
  };
};

geosite.filters["replace"] = function()
{
  return function(value, oldSubstring, newSubstring)
  {
      if(angular.isString(value))
      {
        if(angular.isString(oldSubstring) && angular.isString(newSubstring))
        {
          return value.replace(oldSubstring, newSubstring);
        }
        else
        {
          return value;
        }
      }
      else
      {
        return "";
      }
  };
};

geosite.filters["prepend"] = function()
{
  return function(value, arg)
  {
    if(Array.isArray(arg))
    {
      var arr = arg;
      return arr[value % arr.length] + value;
    }
    else if(arguments.length > 2)
    {
      var arr = Array.prototype.slice.call(arguments, [1]);
      return arr[value % arr.length] + value;
    }
    else
    {
      return arg + value;
    }
  };
};

geosite.directives["ngX"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngX, function(value) {
        $element.attr('x', value);
      });
    }
  };
};
geosite.directives["ngY"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngY, function(value) {
        $element.attr('y', value);
      });
    }
  };
};
geosite.directives["ngWidth"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngWidth, function(value) {
        $element.attr('width', value);
      });
    }
  };
};
geosite.directives["ngR"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngR, function(value) {
        $element.attr('r', value);
      });
    }
  };
};
geosite.directives["ngFill"] = function(){
  return {
    scope: true,
    link: function ($scope, $element, attrs){
      $scope.$watch(attrs.ngFill, function(value) {
        $element.attr('fill', value);
      });
    }
  };
};

geosite.directives["onRepeatDone"] = function(){
  return {
    restriction: 'A',
    link: function($scope, element, attributes ) {
      $scope.$emit(attributes["onRepeatDone"] || "repeat_done", {
        'element': element,
        'attributes': attributes
      });
    }
  };
};

geosite.directives["geositeModalDashboardConfig"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_dashboard_config.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalLayerCarto"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_layer_carto.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalLayerMore"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_layer_more.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalLayerConfig"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_layer_config.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeSymbolCircle"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style"
    },
    templateUrl: 'symbol_circle.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeSymbolEllipse"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style"
    },
    templateUrl: 'symbol_ellipse.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeSymbolGraduated"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style",  // Text binding / one-way binding
      containerWidth: "@" // Text binding / one-way binding
    },
    templateUrl: 'symbol_graduated.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeSymbolGraphic"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: {
      style: "=style"
    },
    templateUrl: 'symbol_graduated.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeLegendBaselayers"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'legend_baselayers.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeLegendFeaturelayers"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'legend_featurelayers.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalWelcome"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_welcome.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalAbout"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_about.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalDownload"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_download.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeserverModalWelcome"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_welcome_geositeserver.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeDashboardEditor"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'dashboard_editor.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.directives["geositeModalEditField"] = function(){
  return {
    restrict: 'EA',
    replace: true,
    //scope: {
    //  layer: "=layer"
    //},
    scope: true,  // Inherit exact scope from parent controller
    templateUrl: 'modal_edit_field.tpl.html',
    link: function ($scope, element, attrs){
    }
  };
};

geosite.controllers["controller_base"] = function($scope, $element, $controller, state, map_config, live)
{

};

geosite.controllers["controller_modal"] = function(
  $scope,
  $element,
  $controller,
  state,
  map_config,
  live)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));
  //
  var jqe = $($element);

  $scope.test = "blah blah blah";
};

geosite.controllers["controller_legend"] = function(
  $scope,
  $element,
  $controller,
  state,
  map_config,
  live)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));
  //
  $scope.map_config = map_config;
  $scope.state = state;
  //////////////
  // Watch
  $scope.updateVariables = function(){
    //$scope.$apply(function() {});
    var arrayFilter = $scope.map_config.legendlayers;
    var featurelayers = $.map($scope.map_config.featurelayers, function(item, key){ return {'key': key, 'item': item}; });
    featurelayers = $.grep(featurelayers,function(x, i){ return $.inArray(x["key"], arrayFilter) != -1; });
    featurelayers.sort(function(a, b){ return $.inArray(a["key"], arrayFilter) - $.inArray(b["key"], arrayFilter); });
    $scope.featurelayers = featurelayers;
  };
  $scope.updateVariables();
  $scope.$watch('map_config.featurelayers', $scope.updateVariables);
  $scope.$watch('map_config.legendlayers', $scope.updateVariables);
  $scope.$watch('state', $scope.updateVariables);
  //////////////
  var jqe = $($element);

  $scope.$on("refreshMap", function(event, args){
    console.log('args: ', args);

    $scope.$apply(function()
    {
      $scope.state = args.state;
    });

    /*var element_featurelayers = jqe.find('.geosite-map-legend-featurelayers');
    $('.geosite-map-legend-item', element_featurelayers).each(function(){
      var layerID = $(this).data('layer');
      var element_symbol = $(this).find('.geosite-map-legend-item-symbol:first');
      var styleID = args.state.styles[layerID];
      var styles = $.grep(geosite.map_config.featurelayers["context"].cartography, function(x, i){
        return x["id"] == styleID;
      });
      var style =  styles.length > 0 ? styles[0] : undefined;
    });*/
  });
};

geosite.controllers["controller_map"] = function($scope, $element, $controller, state, map_config) {

};

var highlightFeature = function(e){
  var layer = e.target;
  /*if("hoverStyle" in layer.options && layer.options.hoverStyle != undefined)
  {
    var newStyle = layer.options.hoverStyle;
    layer.setStyle(newStyle);
    if (!L.Browser.ie && !L.Browser.opera){
      layer.bringToFront();
    }
  }*/
};

var init_map = function(opts)
{
  var map = L.map('map',
  {
    zoomControl: geosite.api.opt_b(opts, "zoomControl", false),
    minZoom: geosite.api.opt_i(opts, "minZoom", 3),
    maxZoom: geosite.api.opt_i(opts, "maxZoom", 18)
  });
  map.setView(
    [geosite.api.opt_i(opts,["latitude", "lat"],0), geosite.api.opt_i(opts,["longitude", "lon", "lng", "long"], 0)],
    geosite.api.opt_i(opts, ["zoom", "z"], 0));

  $.each(geosite.api.opt_j(opts, "listeners"), function(e, f){
    map.on(e, f);
  });

  return map;
};
geosite.controllers["controller_map_map"] = function(
  $rootScope, $scope, $element, $compile, $interpolate, $templateCache,
  state, map_config, live) {
  //////////////////////////////////////
  var listeners =
  {
    click: function(e) {
      var c = e.latlng;
      var delta = {
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.api.intend("clickedOnMap", delta, $scope);
    },
    zoomend: function(e){
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "z": live["map"].getZoom()
      };
      geosite.api.intend("viewChanged", delta, $scope);
    },
    dragend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.api.intend("viewChanged", delta, $scope);
    },
    moveend: function(e){
      var c = live["map"].getCenter();
      var delta = {
        "extent": live["map"].getBounds().toBBoxString(),
        "lat": c.lat,
        "lon": c.lng
      };
      geosite.api.intend("viewChanged", delta, $scope);
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
  var baseLayers = geosite.layers.init_baselayers(live["map"], map_config["baselayers"]);
  $.extend(live["baselayers"], baseLayers);
  var baseLayerID = map_config["baselayers"][0].id;
  live["baselayers"][baseLayerID].addTo(live["map"]);
  geosite.api.intend("viewChanged", {'baselayer': baseLayerID}, $scope);
  geosite.api.intend("layerLoaded", {'type':'baselayer', 'layer': baseLayerID}, $scope);
  //////////////////////////////////////
  // Feature Layers
  $.each(map_config.featurelayers, function(id, layerConfig){
    geosite.layers.init_featurelayer(id, layerConfig, $scope, live, map_config);
  });
  //////////////////////////////////////
  // Sidebar Toggle
  $("#geosite-map-sidebar-toggle-right").click(function (){
    $(this).toggleClass("sidebar-open sidebar-right-open");
    $("#geosite-sidebar-right, #geosite-map").toggleClass("sidebar-open sidebar-right-open");
    setTimeout(function(){
      live["map"].invalidateSize({
        animate: true,
        pan: false
      });
    },2000);
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

  $scope.$on("openPopup", function(event, args) {
    console.log("Refreshing map...");
    if(
      args["featureLayer"] != undefined &&
      args["feature"] != undefined &&
      args["location"] != undefined)
    {
      geosite.popup.openPopup(
        $interpolate,
        args["featureLayer"],
        args["feature"],
        args["location"],
        live["map"],
        angular.element("#geosite-main").scope().state);
    }
  });
};

geosite.controllers["controller_geositeserver_welcome"] = function(
  $scope, $element, $controller, $interpolate, state, map_config, live)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));

  setTimeout(function(){

    $('#dashboard-input', $element).each(function(){
      var s = $(this);
      var placeholder = s.data('placeholder');
      var initialData = s.data('initialData');
      var w = s.data('width');
      var h = s.data('height');
      var css = 'geositeserver-welcome-select-dropdown';
      var template_empty = s.data('template-empty');
      var template_suggestion = s.data('template-suggestion');

      // Twitter Typeahead with
      //https://github.com/bassjobsen/typeahead.js-bootstrap-css
      var engine = new Bloodhound({
        identify: function(obj) {
          return obj['text'];
        },
        datumTokenizer: function(d) {
          return Bloodhound.tokenizers.whitespace(d.text);
        },
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: geosite.initial_data["data"][initialData]
      });

      s.typeahead(null, {
        name: s.attr('name'),
        minLength: 1,
        limit: 10,
        hint: false,
        highlight: true,
        displayKey: 'text',
        source: engine,
        templates: {
          empty: template_empty,
          suggestion: function (data) {
              return '<p><strong>' + data.text + '</strong> - ' + data.id + '</p>';
          },
          footer: function (data) {
            return '<div>Searched for <strong>' + data.query + '</strong></div>';
          }
        }
      }).on('blur', function(event) {
        var results = engine.get($(this).val());
        var backend = $('#'+$(this).data('backend'))
          .val(results.length == 1 ? results[0]['id'] : null)
          .trigger('input')
          .change();
      })
      .on('typeahead:change', function(event, value) {
        console.log("Event: ", event, value);
        var results = engine.get(value);
        var backend = $('#'+$(this).data('backend'))
          .val(results.length == 1 ? results[0]['id'] : null)
          .trigger('input')
          .change();
      })
      .on('typeahead:select typeahead:autocomplete typeahead:cursorchange', function(event, obj) {
        console.log("Event: ", event, obj);
        var backend = $('#'+$(this).data('backend'))
          .val("id" in obj ? obj["id"] : null)
          .trigger('input')
          .change();
      });
    });

    geositeserver.welcome({'scope': $scope});

  }, 10);

};

geosite.controllers["controller_sidebar_geositeserver"] = function($scope, $element, $controller, state, map_config, live)
{
  angular.extend(this, $controller('GeositeControllerBase', {$element: $element, $scope: $scope}));

  $scope.map_config = map_config;
  $scope.map_config_flat = geosite.api.flatten($scope.map_config, undefined);
  $scope.editor = geosite.initial_data["data"]["editor"];
  $scope.map_config_schema = geosite.initial_data["data"]["map_config_schema"];
  $scope.map_config_schema_flat = geosite.api.flatten($scope.map_config_schema, undefined);
  $scope.fields_by_pane = {};
  $scope.value_edit_field = null;

  $scope.updateVariables = function(){

    var fields_by_pane = [];
    for(var i = 0; i < $scope.editor.panes.length; i++)
    {
        var pane = $scope.editor.panes[i];
        var fields_all = [];

        if("fields" in pane && angular.isArray(pane.fields))
        {
          fields_all = fields_all.concat(pane.fields);
        }

        if("section" in pane && pane.section in $scope.map_config_schema)
        {
          fields_all = fields_all.concat($.map($scope.map_config_schema[pane.section], function(value, key){
            return pane.section+"."+key;
          }));
        }

        fields_by_pane.push({'id': pane.id, 'fields': fields_all});
    }
    $scope.fields_by_pane = fields_by_pane;
  };
  $scope.updateVariables();
  $scope.$watch('map_config', $scope.updateVariables);
  $scope.$watch('editor', $scope.updateVariables);
  $scope.$watch('map_config_schema', $scope.updateVariables);
  /*$scope.$watch('map_config',  function(){
    $scope.map_config_flat = geosite.api.flatten($scope.map_config, undefined);
  });
  $scope.$watch('map_config_flat', function(){
    $scope.map_config = geosite.api.unpack($scope.map_config_flat);
  });*/

  var jqe = $($element);

  $scope.validateField = function(field_flat)
  {
    // Update map_config
    if(field_flat.indexOf("__") == -1)
    {
      $scope.map_config[field_flat] = $scope.map_config_flat[field_flat];
    }
    else
    {
      var keyChain = field_flat.split("__");
      var target = $scope.map_config;
      for(var j = 0; j < keyChain.length -1 ; j++)
      {
        var newKey = keyChain[j];
        if(!(newKey in target))
        {
          target[newKey] = {};
        }
        target = target[newKey];
      }
      target[keyChain[keyChain.length-1]] = $scope.map_config_flat[field_flat];
    }
    var type = $(this).data('geosite-field-type');
    console.log('type', type);
  };

  $scope.validateModalField = function(field_flat)
  {
    $scope.map_config_flat[field_flat] = $scope.value_edit_field;
    $scope.validateField(field_flat);
  };

};

var buildPageURL = function($interpolate, map_config, state)
{
  var url = $interpolate(map_config.pages[state["page"]])(state);

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

geosite.controllers["controller_main"] = function(
  $interpolate, $scope, $element, $controller, $http, $q,
  state, map_config, stateschema, live)
{
    $scope.map_config = map_config;
    $scope.state = geosite.init_state(state, stateschema);
    $scope.live = live;

    $scope.refreshMap = function(state){


      // Refresh all child controllers
      $scope.$broadcast("refreshMap", {'state': state});
    };

    // Toggle Modals
    $scope.$on("toggleModal", geosite.listeners.toggleModal);

    // Calendar, Country, Hazard, or Filter Changed
    $scope.$on("stateChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state = $.extend($scope.state, args);
            var url = buildPageURL($interpolate, map_config, $scope.state);
            history.replaceState(state, "", url);
            $scope.refreshMap($scope.state);
        });
    });

    // Filter Changed
    $scope.$on("filterChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state.filters[args["layer"]] = $.extend(
              $scope.state.filters[args["layer"]],
              args["filter"]);
            var url = buildPageURL($interpolate, map_config, $scope.state);
            history.replaceState(state, "", url);
            $scope.refreshMap($scope.state);
        });
    });

    // Style Changed
    $scope.$on("selectStyle", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.$apply(function () {
            $scope.state.styles[args["layer"]] = args["style"];
            var url = buildPageURL($interpolate, map_config, $scope.state);
            history.replaceState(state, "", url);
            $scope.refreshMap($scope.state);
        });
    });

    // Map Panned or Zoomed
    $scope.$on("viewChanged", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        $scope.state.view = $.extend($scope.state.view, args);
        var url = buildPageURL($interpolate, map_config, $scope.state);
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
        var type = args.type;
        var layer = args.layer;
        var visible = args.visible != undefined ? args.visible : true;
        if(type == "featurelayer")
        {
          if(visible)
          {
            $scope.state.view.featurelayers.push(layer);
          }
        }
        else if(type == "baselayer")
        {
          $scope.state.view.baselayer = layer;
        }
    });

    $scope.$on("showLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        var layer = args.layer;
        if($.inArray(layer, $scope.state.view.featurelayers) == -1)
        {
          $scope.state.view.featurelayers.push(layer);
          $scope.refreshMap($scope.state);
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
          $scope.refreshMap($scope.state);
        }
    });
    $scope.$on("showLayers", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        var layers = args.layers;
        for(var i = 0; i < layers.length; i++)
        {
          var layer = layers[i];
          if($.inArray(layer, $scope.state.view.featurelayers) == -1)
          {
            $scope.state.view.featurelayers.push(layer);
            $scope.refreshMap($scope.state);
          }
        }
    });
    $scope.$on("hideLayers", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        var layers = args.layers;
        for(var i = 0; i < layers.length; i++)
        {
          var layer = args.layers[i];
          var j = $.inArray(layer, $scope.state.view.featurelayers);
          if(j != -1)
          {
            $scope.state.view.featurelayers.splice(j, 1);
            $scope.refreshMap($scope.state);
          }
        }
    });
    $scope.$on("switchBaseLayer", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        var $scope = angular.element("#geosite-main").scope();
        $scope.state.view.baselayer = args.layer;
        $scope.refreshMap($scope.state);
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

    $scope.$on("clickedOnMap", function(event, args) {
        console.log('event', event);
        console.log('args', args);
        //
        var $scope = angular.element("#geosite-main").scope();
        var z = $scope.state.view.z;
        var visibleFeatureLayers = $scope.state.view.featurelayers;
        console.log("visibleFeatureLayers", visibleFeatureLayers);
        var featurelayers_by_featuretype = {};
        var fields_by_featuretype = {};
        var urls = [];
        for(var i = 0; i < visibleFeatureLayers.length; i++)
        {
            var fl = map_config.featurelayers[visibleFeatureLayers[i]];
            if(fl.wfs != undefined)
            {
              var params = {
                service: "wfs",
                version: fl.wfs.version,
                request: "GetFeature",
                srsName: "EPSG:4326",
              };

              var targetLocation = new L.LatLng(args.lat, args.lon);
              var bbox = geosite.tilemath.point_to_bbox(args.lon, args.lat, z, 4).join(",");
              var typeNames = fl.wfs.layers || fl.wms.layers || [] ;
              for(var j = 0; j < typeNames.length; j++)
              {
                typeName = typeNames[j];
                var url = fl.wfs.url + "?" + $.param($.extend(params, {typeNames: typeName, bbox: bbox}));
                urls.push(url);
                fields_by_featuretype[typeName.toLowerCase()] = geosite.layers.aggregate_fields(fl);
                featurelayers_by_featuretype[typeName.toLowerCase()] = fl;
              }
            }
          }

          $q.all(geosite.http.build_promises($http, urls)).then(function(responses){
              var features = geosite.http.build_features(responses, fields_by_featuretype);
              console.log("Features: ", features);
              if(features.length > 0 )
              {
                var featureAndLocation = geosite.vecmath.getClosestFeatureAndLocation(features, targetLocation);
                var fl = featurelayers_by_featuretype[featureAndLocation.feature.featuretype];
                $scope.$broadcast("openPopup", {
                  'featureLayer': fl,
                  'feature': featureAndLocation.feature,
                  'location': {
                    'lon': featureAndLocation.location.lng,
                    'lat': featureAndLocation.location.lat
                  }
                });
              }
          });
    });
};


var init_geositeserver_controller_main = function(that, app)
{
  geosite.init_controller(that, app, geosite.controllers.controller_main);

  var selector_controller_base = [
    ".geosite-controller.geosite-about",
    ".geosite-controller.geosite-download",
    ".geosite-controller.geosite-dashboard-config"
  ].join(", ");

  geosite.init_controllers(that, app, [{
      "selector": selector_controller_base,
      "controller": geosite.controllers.controller_base
  }]);

  $('.geosite-controller.geosite-sidebar.geosite-sidebar-right', that).each(function(){
    // Init This
    geosite.init_controller($(this), app, geosite.controllers.controller_sidebar_geositeserver);

    // Init Modals
    geosite.init_controllers(that, app, [{
        "selector": ".geosite-controller.geosite-controller-modal",
        "controller": geosite.controllers.controller_base
    }]);
  });

  $('.geosite-controller.geosite-map', that).each(function(){
    // Init This
    geosite.init_controller($(this), app, geosite.controllers.controller_map);

    // Init Children
    geosite.init_controllers($(this), app, [
      { "selector": ".geosite-controller.geosite-map-map", "controller": geosite.controllers.controller_map_map },
      { "selector": ".geosite-controller.geosite-map-legend", "controller": geosite.controllers.controller_legend },
      { "selector": ".geosite-controller.geositeserver-welcome", "controller": geosite.controllers.controller_geositeserver_welcome }
    ]);

    // Init Modals
    geosite.init_controllers($(this), app, [
      {
        "selector": ".geosite-controller.geosite-controller-modal",
        "controller": geosite.controllers.controller_base
      }
    ]);
  });
};

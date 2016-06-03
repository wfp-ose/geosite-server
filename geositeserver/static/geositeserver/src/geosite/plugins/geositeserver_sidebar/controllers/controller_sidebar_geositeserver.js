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

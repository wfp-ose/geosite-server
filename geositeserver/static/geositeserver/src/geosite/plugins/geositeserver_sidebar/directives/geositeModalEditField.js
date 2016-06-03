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

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

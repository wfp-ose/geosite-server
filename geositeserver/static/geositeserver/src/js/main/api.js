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

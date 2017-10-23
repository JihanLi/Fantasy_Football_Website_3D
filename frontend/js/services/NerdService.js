angular.module('NerdService', []).factory('Test', ['$http', function($http) {

    return {
        get : function() {
            return $http.get('/queryAll');
        },

        create : function(nerdData) {
            return $http.post('/addNew', nerdData);
        },

        delete : function(id) {
            return $http.delete('/deleteOne' + id);
        }
    }       

}]);
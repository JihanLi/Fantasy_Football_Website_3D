angular.module('appRoutes', []).config(['$routeProvider', '$locationProvider', 
	function($routeProvider, $locationProvider) 
	{
	  $routeProvider
	  		.when('/', {
	          templateUrl: 'views/disp1.html',
	          controller: 'MainController'
	      })
	  		.when('/home', {
	          templateUrl: 'views/disp1.html',
	          controller: 'MainController'
	      })
	      .when('/rules', {
	          templateUrl: 'views/disp1.html',
	          controller: 'MainController'
	      })
	      .when('/news', {
	          templateUrl: 'views/disp1.html',
	          controller: 'MainController'
	      })
	      .when('/forum', {
	          templateUrl: 'views/disp1.html',
	          controller: 'MainController'
	      })
	      .when('/about', {
	          templateUrl: 'views/disp1.html',
	          controller: 'MainController'
	      })
	      .when('/home2', {
	          templateUrl: 'views/disp2.html',
	          controller: 'NerdController'
	      })
	      .when('/rules2', {
	          templateUrl: 'views/disp2.html',
	          controller: 'NerdController'
	      })
	      .when('/news2', {
	          templateUrl: 'views/disp2.html',
	          controller: 'NerdController'
	      })
	      .when('/forum2', {
	          templateUrl: 'views/disp2.html',
	          controller: 'NerdController'
	      })
	      .when('/about2', {
	          templateUrl: 'views/disp2.html',
	          controller: 'NerdController'
	      })
	      ;
	
	  $locationProvider.html5Mode(true);
	}
]);
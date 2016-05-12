  function gitCtrl($scope, $http) {
      $scope.getGitInfo = function () {
         $scope.userNotFound = false;
         $scope.loaded = false;
         $http.get("https://api.github.com/repos/" + $scope.username + "/ama/issues?state=all&per_page=300")
               .success(function (data) {
                  if (data.name == "") data.name = data.login;
                  $scope.user = data;
                  $scope.loaded = true;
           
               })
               .error(function () {
                  $scope.userNotFound = true;
               });
        
      }
   }
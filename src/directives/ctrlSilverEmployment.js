(function(angular, undefined) {
  'use strict';

  var myDirectiveName = 'ctrlSilverEmployment';

  angular.module('gsn.core')
    .controller(myDirectiveName, ['$scope', 'gsnProfile', 'gsnApi', '$timeout', 'gsnStore', '$interpolate', '$http', '$location', myController])
    .directive(myDirectiveName, myDirective);

  function myDirective() {

    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  function myController($scope, gsnProfile, gsnApi, $timeout, gsnStore, $interpolate, $http, $location) {

    $scope.jobPositionList = [];
    $scope.jobOpenings = [];
    $scope.states = [];
    $scope.jobPositionId = 0;
    $scope.jobPositionTitle = '';
    $scope.indexedListings = [];

    var template;

    $http
      .get($scope.getThemeUrl('/views/email/employment-apply.html'))
      .success(function(response) {
        template = response.replace(/data-ctrl-email-preview/gi, '');
      });

    $scope.jobsToFilter = function() {

      // Reset the flag
      $scope.indexedListings = [];

      // Return the job listings.
      return $scope.jobPositionList;
    };

    $scope.filterJobs = function(job) {

      // If this store is not in the array, then get out.
      var jobIsNew = $scope.indexedListings.indexOf(job.JobPositionTitle) === -1;

      if (jobIsNew) {
        $scope.indexedListings.push(job.JobPositionTitle);
      }

      return jobIsNew;
    };

    $scope.hasJobs = function() {
      return $scope.jobPositionList.length > 0;
    };

    $scope.activate = function() {

      var url = gsnApi.getStoreUrl().replace(/store/gi, 'job') + '/GetChainJobPositions/' + gsnApi.getChainId();

      $http
        .get(url, {
          headers: gsnApi.getApiHeaders()
        })
        .then(function(response) {

          // Store the response data in the job position list.
          $scope.jobPositionList = response.data;

          for (var index = 0; index < $scope.jobPositionList.length; index++) {

            //the api has a setting turned on to return $ref on repeated json sections to avoid circular references
            //to avoid having to interpret that, we have serialized the opening stores to strings
            //here we are simply deserializing them back to json objects for ease of display
            $scope.jobOpenings = JSON.parse($scope.jobPositionList[index].Openings);
            $scope.jobPositionList[index].Openings = $scope.jobOpenings;
          }
        });

      // Get the states.
      gsnStore.getStates().then(function(rsp) {
        $scope.states = rsp.response;
      });
    };

    $scope.isApplicationSubmitted = function() {

      return $scope.isSubmitted === true;
    };

    ////
    // Register the Application
    ////
    $scope.registerApplication = function() {

      // Reset the error message.
      $scope.errorResponse = '';

      // Make sure that the application form is valid.
      if ($scope.applicationForm.$valid) {
        var payload = {};

        //find the store that this job id is associated with
        var openings = $scope.jobOpenings;
        var storeId = $location.search().sid;

        angular.forEach(openings, function(value, key) {

          if (storeId === value.OpeningStore.StoreId) {
            $scope.email.selectedStore = value.OpeningStore;
          }
        });

        // Generate the email address
        var message = $interpolate(template)($scope);

        // Populate the payload object
        payload.Message = message;
        payload.Subject = 'Employment application for - ' + $scope.jobPositionTitle;
        payload.EmailTo = $scope.email.Email;
        payload.EmailFrom = gsnApi.getRegistrationFromEmailAddress();

        // Exit if we are submitting.
        if ($scope.isSubmitting) return;

        // Set the flags.
        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        $scope.errorResponse = null;

        // Send the email message
        gsnProfile
          .sendEmploymentEmail(payload, $scope.email.selectedStore.StoreId)
          .then(function(result) {

            // Reset the flags.
            $scope.isSubmitting = false;
            $scope.hasSubmitted = false;
            $scope.isValidSubmit = result.success;

            // Success?
            if (result.success) {

              // Define the object
              var jobApplication = {};

              // Populate the Job Application object.
              jobApplication.JobOpeningId = $scope.jobOpenings[0].JobOpeningId;
              jobApplication.FirstName = $scope.email.FirstName;
              jobApplication.LastName = $scope.email.LastName;
              jobApplication.PrimaryAddress = $scope.email.PrimaryAddress;
              jobApplication.SecondaryAddress = $scope.email.SecondaryAddress;
              jobApplication.City = $scope.email.City;
              jobApplication.State = $scope.email.State;
              jobApplication.PostalCode = $scope.email.Zip;
              jobApplication.Phone = $scope.email.Phone;
              jobApplication.ApplicationContent = message;
              jobApplication.Email = $scope.email.Email;

              // Call the api.
              var url = gsnApi.getStoreUrl().replace(/store/gi, 'job') + '/InsertJobApplication/' + gsnApi.getChainId() + '/' + $scope.email.selectedStore.StoreId;

              $http
                .post(url, jobApplication, {
                  headers: gsnApi.getApiHeaders()
                })
                .success(function(response) {

                  $scope.isSubmitted = true;

                }).error(function(response) {
                  alert(response);
                  $scope.errorResponse = 'Your job application was un-successfully posted.';
                });

            } else {

              $scope.errorResponse = 'Your job application was un-successfully posted.';
            }
          });
      }
    };

    $scope.activate();
  }
})(angular);

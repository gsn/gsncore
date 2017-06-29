( function ( angular, undefined ) {
  'use strict';

  var myDirectiveName = 'ctrlEmployment';

  angular.module( 'gsn.core' )
    .controller( myDirectiveName, [ '$scope', 'gsnProfile', 'gsnApi', '$timeout', 'gsnStore', '$interpolate', '$http', '$rootScope', '$location', '$q', myController ] )
    .directive( myDirectiveName, myDirective );

  function myDirective() {
    var directive = {
      restrict: 'EA',
      scope: true,
      controller: myDirectiveName
    };

    return directive;
  }

  ////
  // Controller
  ////
  function myController( $scope, gsnProfile, gsnApi, $timeout, gsnStore, $interpolate, $http, $rootScope, $location, $q ) {

    $scope.hasSubmitted = false; // true when user has click the submit button
    $scope.isValidSubmit = true; // true when result of submit is valid
    $scope.isSubmitting = false; // true if we're waiting for result from server
    $scope.errorResponse = '';
    $scope.isSubmitted = false;

    // Data fields.
    $scope.jobPositionList = [];
    $scope.jobOpenings = [];
    $scope.states = [];
    $scope.jobPositionId = 0;
    $scope.jobPositionTitle = '';

    // Email data
    $scope.email = {
      selectedStore: null,
      FirstName: '',
      LastName: '',
      PrimaryAddress: '',
      SecondaryAddress: '',
      City: '',
      State: '',
      Zip: '',
      Phone: '',
      Email: '',
      StoreLocation: '',
      Postion1: '',
      Postion2: '',
      Postion3: '',
      Monday: '',
      Tuesday: '',
      Wednesday: '',
      Thursday: '',
      Friday: '',
      Saturday: '',
      Sunday: '',
      WorkedFrom: '',
      WorkedTo: '',
      EducationCompleted: 'in high school',
      EducationLocation: '',
      ReasonsToHire: '',
      RecentJobLocation: '',
      RecentJobPosition: '',
      RecentJobYears: '',
      RecentJobSupervisor: '',
      RecentJobPhone: '',
      RecentJobLocation2: '',
      RecentJobPosition2: '',
      RecentJobYears2: '',
      RecentJobSupervisor2: '',
      RecentJobPhone2: '',
      AuthorizationName: '',
      Suggestions: ''
    };
    $scope.indexedListings = [];
    var template;

    ////
    // Load the template.
    ////
    $http.get( $scope.getThemeUrl( '/views/email/employment-apply.html' ) )
      .success( function ( response ) {
        template = response.replace( /data-ctrl-email-preview/gi, '' );
      } );

    ////
    // jobs To Filter
    ////
    $scope.jobsToFilter = function () {

      // Reset the flag
      $scope.indexedListings = [];

      // Return the job listings.
      return $scope.jobPositionList;
    };

    ////
    // Filter Jobs
    ////
    $scope.filterJobs = function ( job ) {

      // If this store is not in the array, then get out.
      var jobIsNew = $scope.indexedListings.indexOf( job.JobPositionTitle ) === -1;
      if ( jobIsNew ) {
        $scope.indexedListings.push( job.JobPositionTitle );
      }

      return jobIsNew;
    };

    ////
    // Has Jobs
    ////
    $scope.hasJobs = function () {

      var hasJob = 0;

      for ( var index = 0; index < $scope.jobPositionList.length; index++ ) {
        if ( ( gsnApi.isNull( $scope.jobPositionList[ index ].JobOpenings, null ) !== null ) && ( $scope.jobPositionList[ index ].JobOpenings.length > 0 ) ) {

          // Has Jobs
          hasJob = 1;

          // Done.
          break;
        }
      }

      return hasJob;
    };

    ////
    // Activate
    ////
    $scope.activate = function () {

      // Get the PositionId and StoreId
      $scope.jobPositionId = $location.search().Pid;
      $scope.storeId = $location.search().Sid;


      // Generate the Urls.
      var Url = gsnApi.getStoreUrl().replace( /store/gi, 'job' ) + '/GetChainJobPositions/' + gsnApi.getChainId();
      $http.get( Url, {
          headers: gsnApi.getApiHeaders()
        } )
        .then( function ( response ) {

          // Store the response data in the job position list.
          $scope.jobPositionList = response.data;

          // The application data must have a selected value.
          if ( $scope.jobPositionId > 0 ) {

            // Find the item with the id. {small list so fast}
            for ( var index = 0; index < $scope.jobPositionList.length; index++ ) {

              // Find the position that will have the stores.
              if ( $scope.jobPositionList[ index ].JobPositionId === $scope.jobPositionId ) {

                // Store the list of job openings.
                $scope.jobOpenings = angular.fromJson( $scope.jobPositionList[ index ].Openings );
                $scope.jobPositionTitle = $scope.jobPositionList[ index ].JobPositionTitle;

                if ( $scope.storeId ) {
                  for ( var i = $scope.jobOpenings.length - 1; i >= 0; i-- ) {
                    if ( $scope.jobOpenings[ i ].StoreId !== $scope.storeId ) {
                      $scope.jobOpenings.splice( i, 1 );
                    } else {
                      $scope.email.selectedStore = $scope.jobOpenings[ i ].OpeningStore;
                      break;
                    }
                  }
                }

                // Break out of the loop, we found our man.
                break;
              }
            }
          }
        } );

      // Get the states.
      gsnStore.getStates().then( function ( rsp ) {
        $scope.states = rsp.response;
      } );
    };

    ////
    // Is Application submitted
    ////
    $scope.isApplicationSubmitted = function () {

      return $scope.isSubmitted === true;
    };

    ////
    // Register the Application
    ////
    $scope.registerApplication = function () {

      // Reset the error message.
      $scope.errorResponse = '';

      // Make sure that the application form is valid.
      if ( $scope.applicationForm.$valid ) {

        // Generate the email address
        var Message = $interpolate( template )( $scope );

        // Declare the payload.
        var payload = {};

        // Populate the payload object
        payload.Message = Message;
        payload.Subject = 'Employment application for - ' + $scope.jobPositionTitle;
        payload.EmailTo = $scope.email.Email; // + ';' + $scope.email.selectedStore.Email;
        payload.EmailFrom = gsnApi.getRegistrationFromEmailAddress();

        // Exit if we are submitting.
        if ( $scope.isSubmitting ) return;

        // Set the flags.
        $scope.hasSubmitted = true;
        $scope.isSubmitting = true;
        $scope.errorResponse = null;

        // Send the email message
        gsnProfile.sendEmail( payload )
          .then( function ( result ) {

            // Reset the flags.
            $scope.isSubmitting = false;
            $scope.hasSubmitted = false;
            $scope.isValidSubmit = result.success;

            // Success?
            if ( result.success ) {

              // Define the object
              var JobApplication = {};

              // Populate the Job Application object.
              JobApplication.JobOpeningId = $scope.jobOpenings[ 0 ].JobOpeningId;
              JobApplication.FirstName = $scope.email.FirstName;
              JobApplication.LastName = $scope.email.LastName;
              JobApplication.PrimaryAddress = $scope.email.PrimaryAddress;
              JobApplication.SecondaryAddress = $scope.email.SecondaryAddress;
              JobApplication.City = $scope.email.City;
              JobApplication.State = $scope.email.State;
              JobApplication.PostalCode = $scope.email.Zip;
              JobApplication.Phone = $scope.email.Phone;
              JobApplication.ApplicationContent = Message;
              JobApplication.Email = $scope.email.Email;

              // Call the api.
              var Url = gsnApi.getStoreUrl().replace( /store/gi, 'job' ) + '/InsertJobApplication/' + gsnApi.getChainId() + '/' + $scope.email.selectedStore.StoreId;
              $http.post( Url, JobApplication, {
                headers: gsnApi.getApiHeaders()
              } ).success( function ( response ) {

                // Success
                $scope.isSubmitted = true;

              } ).error( function ( response ) {

                // Store the response.
                $scope.errorResponse = 'Your job application was un-successfully posted.';
              } );

            } else {

              // Store the response when its an object.
              $scope.errorResponse = 'Your job application was un-successfully posted.';
            }
          } );
      }
    };

    // Activate
    $scope.activate();
  }
} )( angular );

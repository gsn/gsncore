( function ( angular, undefined ) {
  'use strict';
  var myModule = angular.module( 'gsn.core' );

  myModule.directive( 'gsnPopoverDialog', [ 'gsnApi', '$localStorage', '$compile', function ( gsnApi, $localStorage, $compile ) {
    return {
      restrict: 'EA',
      template: '<div id="myProductDetailsModal" class="modal fade" role="dialog"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><button type="button" class="close" data-dismiss="modal">&times;</button><h4 class="modal-title">{{productData.Description}}</h4> </div><div class="modal-body"><div class="row" style="border-top:0;" ><div class="col-md-6"><img ng-show="productData.ImageUrl" data-ng-src="{{productData.ImageUrl}}" alt="[Product Image]" style="max-width: 200px; max-height: 200px;min-width: 200px; min-height: 200px"/></div><div class="col-md-6"><div class="row" style="border-top:0;"><div class="col-md-6 align-left"><label>UPC:</label></div><div class="col-md-6 align-left"><label>{{productData.UPC11}}</label></div></div><div class="row" style="border-top:0;"><div class="col-md-6 align-left"><label>Size:</label></div><div class="col-md-6 align-left"><label>{{productData.ItemExtendedSize}}</label></div></div><div class="row" style="border-top:0;"><div class="col-md-6 align-left"><label>SalePrice:</label></div><div class="col-md-6 align-left"><label ng-show="productData.SalePrice">${{productData.SalePrice.toFixed(2)}}</label></div></div><div class="row" style="border-top:0;"><div class="col-md-6 align-left"><label>Brand:</label></div><div class="col-md-6 align-left"><label>{{productData.BrandName}}</label></div></div></div></div></div><div class="modal-footer"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div></div></div></div>',

      link: function ( scope, element, attrs ) {}
    };
  } ] );

} )( angular );

angular.module('asch').controller('blockchainCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $window, NgTableParams, $translate,TransactionRecords) {
	$rootScope.active = 'blockchain';
	$rootScope.userlogin = true;
	$rootScope.blockchaintopList = true;
	$rootScope.blocktransactionsUnderBlock = false;
	$rootScope.blocktransactionsUnderAddress = false;
	$rootScope.blocktransactionsDetail = false;
	$rootScope.showdealInfo = function (i) {
		$rootScope.blockdetailinfo = false;
		$rootScope.accountdetailinfo = false;
		$scope.i = i;
		$rootScope.$broadcast('jiaoyi', $scope.i)
	}
	$rootScope.showdetailInfo = function (i) {
		$rootScope.accountdetailinfo = false;
		$rootScope.dealdetailinfo = false;
		$scope.i = i;
		$rootScope.$broadcast('detail', $scope.i)
	}
	$rootScope.showaccountdetailInfo = function (i) {
		$rootScope.blockdetailinfo = false;
		$rootScope.dealdetailinfo = false;
		$scope.i = i;
		$rootScope.$broadcast('accountdetail', $scope.i)
	}
	$scope.init = function () {
		initialTable();
	};
	function initialTable(){
		$scope.blockchaintableparams = new NgTableParams({
			page: 1,
			count: 20,
			sorting: {
				height: 'desc'
			}
		}, {
			total: 0,
			getData: function ($defer, params) {
				apiService.blocks({
					limit: params.count(),
					orderBy: 'height:desc',
					offset: (params.page() - 1) * params.count()
				}).success(function (res) {
					params.total(res.count);
					$defer.resolve(res.blocks);
				}).error(function (res) {
					toastError($translate.instant('ERR_SERVER_ERROR'));
				});
			}
		});
	}
	//搜索区块或地址或交易ID
	$scope.searchBlockOrAddress = function () {
		if (!$scope.search) {
			initialTable();
			toast($translate.instant('ERR_SEARCH_EMPTY'));
		}else{
			var content = $scope.search.replace(/(^\s*)|(\s*$)/g, "");
			if(/^[A-Za-z\d]{33,34}$/.test(content)){
				$rootScope.showAddressTransactions(content);
			}else if(/^\d+$/.test(content)){
				$rootScope.showBlockTransactionsByHeight(content);
			}else if(content.length==64){
		        $rootScope.showTransactionDetailById(content);
		    }else if(content.length<33 && !/^\d+$/.test(content)){
		        toast($translate.instant('ACCOUNT_NOT_FOUND'));
		    }else if(content.length>34 && !/^\d+$/.test(content)){
		        toast($translate.instant('TRANSACTION_ID_NOT_FOUND'));
		    }else{
		    	toast($translate.instant('INCORRECT_TYPEIN'));
		    }
		}
	}
	//区块下的交易详情
	$rootScope.showBlockTransactionsByHeight = function(i){
		apiService.blockDetail({
			height: i
		}).success(function (res) {
			if(res.success){
				$rootScope.blockchaintopList = false;
				$rootScope.blocktransactionsUnderBlock = true;
				$rootScope.blocktransactionsUnderAddress = false;
				$rootScope.blocktransactionsDetail = false;
				res.block.totalFee = res.block.totalFee / Math.pow(10,6);
		        res.block.reward = res.block.reward / Math.pow(10,6);
		        $scope.block = res.block;
		        $scope.blockTransactions = new TransactionRecords(res.block.id,"block");
		        $scope.blockTransactions.nextPage();
		    }else{
				toast(res.error);
			}
		}).error(function (res) {
			toastError($translate.instant('ERR_SERVER_ERROR'));
		});
		
	}
	$rootScope.showBlockTransactionsById = function(i){
		apiService.blockDetail({
			id:i
		}).success(function (res) {
			if(res.success){
				$rootScope.blockchaintopList = false;
				$rootScope.blocktransactionsUnderBlock = true;
				$rootScope.blocktransactionsUnderAddress = false;
				$rootScope.blocktransactionsDetail = false;
				res.block.totalFee = res.block.totalFee / Math.pow(10,6);
		        res.block.reward = res.block.reward / Math.pow(10,6);
		        $scope.block = res.block;
			}else{
				toast(res.error);
			}
		}).error(function (res) {
			toastError($translate.instant('ERR_SERVER_ERROR'));
		});
		$scope.blockTransactions = new TransactionRecords(i,"block");
		$scope.blockTransactions.nextPage();
	}
	//地址下的交易详情
	$rootScope.showAddressTransactions = function(i){
		if(i == "System")return;
		$scope.addressTransactions = new TransactionRecords(i,"address");
		$scope.addressTransactions.nextPage();
		apiService.accountdetail({
			address: i
		}).success(function (res) {
			if(res.success){
				$rootScope.blockchaintopList = false;
				$rootScope.blocktransactionsUnderBlock = false;
				$rootScope.blocktransactionsUnderAddress = true;
				$rootScope.blocktransactionsDetail = false;
				res.account.balance = res.account.balance / Math.pow(10,6);
				$scope.addressInfo = res;
				apiService.transactions({
					senderId: i,
			    	recipientId: i
				}).success(function (response) {
					if(response.success){
						$scope.addrTransactionCount = response.count;
					}else{
						toast(response.error);
					}
				});
			}else{
				toast(res.error);
			}
		}).error(function (res) {
			toastError($translate.instant('ERR_SERVER_ERROR'));
		});
		
	}
	//根据交易id查询交易信息
	$rootScope.showTransactionDetailById=function(i){
		apiService.transactiondetail({
			id: i
	    }).success(function (res) {
	    	if(res.success){
	    		$rootScope.blockchaintopList = false;
				$rootScope.blocktransactionsUnderBlock = false;
				$rootScope.blocktransactionsUnderAddress = false;
				$rootScope.blocktransactionsDetail = true;
		    	res.transaction.recipientId = res.transaction.recipientId === ""?"System":res.transaction.recipientId;
		    	res.transaction.currency = res.transaction.currency === ""?"ACC":res.transaction.currency;
		    	res.transaction.fee = res.transaction.fee / Math.pow(10,6);
		    	$scope.bytesCount = JSON.stringify(res).length;
				$scope.transactionsDetail = res.transaction;
			}else{
	    		toast(res.error);
	    	}
		}).error(function (res) {
			toastError($translate.instant('ERR_SERVER_ERROR'));
		});
	}
	//返回
	$scope.returnTopList = function(){
		initialTable();
		$rootScope.blockchaintopList = true;
		$rootScope.blocktransactionsUnderBlock = false;
		$rootScope.blocktransactionsUnderAddress = false;
		$rootScope.blocktransactionsDetail = false;
	}
	//展示全部
	$rootScope.otherbalancesInfo = false;
	$rootScope.showotherbalancesInfo = function (i) {
		apiService.myBalances({
			address: i
	    }).success(function (res) {
	    	if(res.success){
	    		if(res.count != 0){
	    			$rootScope.isBodyMask = true;
	    			$rootScope.otherbalancesInfo = true;
	    			for(var i=0;i<res.balances.length;i++){
	    				res.balances[i].balance = res.balances[i].balance / Math.pow(10,res.balances[i].precision);
	    			}
	    			$scope.otherbalances = res.balances;	
	    		}else{
	    			toastError($translate.instant('NO_OTHERBALANCES'));
	    		}
	    	}else{
	    		toast(res.error);
	    	}
		}).error(function (res) {
			toastError($translate.instant('ERR_SERVER_ERROR'));
		});
    }
	$scope.close = function () {
        $rootScope.isBodyMask = false;
        $rootScope.otherbalancesInfo = false;
    };
});


angular.module('asch').factory('TransactionRecords', function(apiService) {
	var TransactionRecords = function(condition,type) {
	    this.items = [];
	    this.busy = false;
	    this.limit = 10;
	    this.offset = 0;
	    this.disable = false;
	    this.condition = condition;
	    this.type = type;
	};
	TransactionRecords.prototype.nextPage = function() {
	    if (this.busy) return;
	    this.busy = true;
		if(this.type == "block"){
			apiService.transactions({
				limit:this.limit,
				offset: this.offset,
				orderBy: 't_timestamp:desc',
				blockId:this.condition
			}).success(function (response) {
				if(response.success){
					//console.log(response);
					var items = response.transactions;
					for (var i = 0; i < items.length; i++) {
						items[i].recipientId = items[i].recipientId === ""?"System":items[i].recipientId;
						items[i].fee = items[i].fee / Math.pow(10,6);
			            this.items.push(items[i]);
			        }
			       	this.busy = false;
			    	if(this.offset+this.limit > response.count){
			    		this.offset += (this.offset+this.limit-response.count);
			    		this.disable= true;
			    	}else{
			    		this.offset += 10;
			    	}
				}else{
					toast(response.error);
				}
			}.bind(this)).error(function (response) {
				toastError($translate.instant('ERR_SERVER_ERROR'));
			});
		}else if(this.type == "address"){
			apiService.transactions({
				limit:this.limit,
				offset: this.offset,
				orderBy: 't_timestamp:desc',
				senderId:this.condition,
				recipientId:this.condition
			}).success(function (response) {
				if(response.success){
					//console.log(response);
					var items = response.transactions;
					for (var i = 0; i < items.length; i++) {
						items[i].recipientId = items[i].recipientId === ""?"System":items[i].recipientId;
						items[i].currency = items[i].currency === ""?"ACC":items[i].currency;
						items[i].fee = items[i].fee / Math.pow(10,6);
			            this.items.push(items[i]);
			        }
			       	this.busy = false;
			    	if(this.offset+this.limit > response.count){
			    		this.offset += (this.offset+this.limit-response.count);
			    		this.disable= true;
			    	}else{
			    		this.offset += 10;
			    	}
				}else{
					toast(response.error);
				}
			}.bind(this)).error(function (response) {
				toastError($translate.instant('ERR_SERVER_ERROR'));
			});
		}
	};
	return TransactionRecords;
});



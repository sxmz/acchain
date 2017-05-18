angular.module('asch').controller('assetCtrl', function ($scope, $rootScope, apiService, ipCookie, $location, $window, NgTableParams,userService,postSerivice, $translate,$uibModal) {
    $rootScope.active = 'asset';
    $rootScope.userlogin = true;
    $rootScope.isBodyMask = false;
    //comfirmDialog
    $scope.comfirmDialog = false;
    $rootScope.secpwd = !!userService.secondPublicKey;
    $scope.estimateUnitRange = ['USD', 'RMB', 'JPY', 'EUR', 'GBP'];
    $scope.unlockConditionRange = [ 
		{ 
		label: $translate.instant('UNBLOCK_CONDITION_1'),
		value: 0 
		},
		{ 
		label: $translate.instant('UNBLOCK_CONDITION_2'),
		value: 1 
		} 
	];
	$scope.chosenLang = 0;
    if($translate.proposedLanguage() == "en-us"){
		$scope.chosenLang = 1;	
	}
	
    //没有注册发行商
    $scope.init = function () {
		checkTab();
        apiService.issuer({
            address: userService.address
        }).success(function (res) {
            if (res.success == true) {
                // 已经注册发行商
                $scope.monname = res.issuer.name;
                $scope.mondesc = res.issuer.desc;
                userService.isStatus(true);
                userService.isName(res.issuer.name);
                $scope.issuerStatus = userService.issuerStatus;

            } else {
                // 没有发行商
                userService.isStatus(false);
                $scope.issuerStatus = userService.issuerStatus;

            }
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
        //初始化一级类目下拉
        apiService.assetcategory({
            id: 0
        }).success(function (res) {
     	   $scope.assetCategoryLevelOne = res.categories;
        }).error(function (res) {
           toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    };
    var selDeepest = false;
    var selwrapStr = "";
	$scope.selectonechange = function(sel){
		$scope.selectedLevelTwo = "";
		$scope.selectedLevelThree = "";
		$scope.selectedLevelFour = "";
		$scope.selectedLevelFive = "";
		for(var i=0;i<$scope.assetCategoryLevelOne.length;i++){
			if($scope.assetCategoryLevelOne[i] == sel){
				selDeepest = $scope.assetCategoryLevelOne[i].hasChildren;
			}
		}
		if(selDeepest){
			apiService.assetcategorynext({
	            id: sel.id
		    }).success(function (res) {
		     	$scope.assetCategoryLevelTwo= res.categories;
		    }).error(function (res) {
		       toastError($translate.instant('ERR_SERVER_ERROR'));
		    });
		}else{
			$scope.assetCategoryLevelTwo = [];
		}
		selwrapStr = sel.id;
	}
	$scope.selecttwochange = function(sel){
		$scope.selectedLevelThree = "";
		$scope.selectedLevelFour = "";
		$scope.selectedLevelFive = "";
		if (!sel) {
			return
		}
		for(var i=0;i<$scope.assetCategoryLevelTwo.length;i++){
			if($scope.assetCategoryLevelTwo[i] == sel){
				selDeepest = $scope.assetCategoryLevelTwo[i].hasChildren;
			}
		}
		if(selDeepest){
			apiService.assetcategorynext({
	            id: sel.id
		    }).success(function (res) {
		     	$scope.assetCategoryLevelThree= res.categories;
		    }).error(function (res) {
		       toastError($translate.instant('ERR_SERVER_ERROR'));
		    });
		}else{
			$scope.assetCategoryLevelThree = [];
		}
		selwrapStr = sel.id;
	}
	$scope.selectthreechange = function(sel){
		$scope.selectedLevelFour = "";
		$scope.selectedLevelFive = "";
		if (!sel) {
			return
		}
		for(var i=0;i<$scope.assetCategoryLevelThree.length;i++){
			if($scope.assetCategoryLevelThree[i] == sel){
				selDeepest = $scope.assetCategoryLevelThree[i].hasChildren;
			}
		}
		if(selDeepest){
			apiService.assetcategorynext({
	            id: sel.id
		    }).success(function (res) {
		     	$scope.assetCategoryLevelFour= res.categories;
		    }).error(function (res) {
		       toastError($translate.instant('ERR_SERVER_ERROR'));
		    });
		}else{
			$scope.assetCategoryLevelFour = [];
		}
		selwrapStr = sel.id;
	}
	$scope.selectfourchange = function(sel){
		$scope.selectedLevelFive = "";
		if (!sel) {
			return
		}
		for(var i=0;i<$scope.assetCategoryLevelFour.length;i++){
			if($scope.assetCategoryLevelFour[i] == sel){
				selDeepest = $scope.assetCategoryLevelFour[i].hasChildren;
			}
		}
		if(selDeepest){
			apiService.assetcategorynext({
	            id: sel.id
		    }).success(function (res) {
		     	$scope.assetCategoryLevelFive= res.categories;
		    }).error(function (res) {
		       toastError($translate.instant('ERR_SERVER_ERROR'));
		    });
		}else{
			$scope.assetCategoryLevelFive = [];
		}
		selwrapStr = sel.id;
	}
	
    $scope.assetprofile = true;
    $scope.registerpublish = false;
    $scope.registerasset = false;
    $scope.myAssets = false;
    $scope.chainAssets = false;
    $scope.operationRecord = false;
    $scope.allowValueRange = [
        {key: '0', value: $translate.instant('NOT_ALLOW')},
        {key: '1', value: $translate.instant('ALLOW')}
    ];
    function checkTab(){
        switch(userService.tab)
        {
            case 1:
                $scope.assetprofilechange();
                break;
            case 2:
                $scope.registerpublishchange();
                break;
            case 3:
                $scope.registerAssetchange();
                break;
            case 4:
                $scope.myAssetschange();
                break;
            case 5:
                $scope.chainAssetschange();
                break;
            /*
            case 6:
                $scope.operationRecordchange();
                break;
            */
            default:
                $scope.assetprofilechange();
        }
    }

    // 资产概况
    $scope.assetprofilechange = function () {
        $scope.assetprofile = true;
        $scope.registerpublish = false;
        $scope.registerasset = false;
        $scope.myAssets = false;
        $scope.operationRecord = false;
        $scope.chainAssets = false;
        userService.saveTab(1);
        if($scope.assetprofiletableparams){
            $scope.assetprofiletableparams.reload();
        } else {
        $scope.assetprofiletableparams = new NgTableParams({
            page: 1,
            count: 20,
            sorting: {
                height: 'desc'
            }
        }, {
            total: 0,
            getData: function ($defer, params) {
                apiService.myBalances({
                    limit: params.count(),
                    offset: (params.page() - 1) * params.count(),
                    address: userService.address
                }).success(function (res) {
                    params.total(res.count);
                    for (var i in res.balances) {
                        var precision = res.balances[i].precision;
                        res.balances[i].balance = parseInt(res.balances[i].balance) / Math.pow(10, precision);
                        //res.balances[i].maximum = parseInt(res.balances[i].maximum) / Math.pow(10, precision);
                        res.balances[i].quantity = parseInt(res.balances[i].quantity) / Math.pow(10, precision);
                    }
                    $defer.resolve(res.balances);
                }).error(function (res) {
                    toastError($translate.instant('ERR_SERVER_ERROR'));
                });
            }
        });
        }
    };
    //注册发行商tab
    $scope.registerpublishchange = function () {
        $scope.registerpublish = true;
        $scope.assetprofile = false;
        $scope.registerasset = false;
        $scope.myAssets = false;
        $scope.operationRecord = false;
        $scope.chainAssets = false;
        userService.saveTab(2);
    };
    //注册发行商
    $scope.registerPublish = function () {
        if(userService.issuerStatus){
            toastError($translate.instant('ISSUER_REG_COMPLETED'));
            return false;
        }
        var name = $scope.monname;
        var desc = $scope.mondesc;
        if(!$scope.monname || !$scope.mondesc){
            return toastError($translate.instant('ISSUER_DESC_NEEDED'));
        }

        if (!userService.secondPublicKey) {
            $scope.rpsecondPassword = '';
        }
        $scope.publishtrs = AschJS.uia.createIssuer(name, desc, userService.secret, $scope.rpsecondPassword);
        $scope.comfirmDialog = true;
        $scope.dialogNUM = 1;
        $rootScope.isBodyMask = true;
    };
    //注册资产tab
    $scope.registerAssetchange = function () {
        $scope.assetprofile = false;
        $scope.registerpublish = false;
        $scope.registerasset = true;
        $scope.myAssets = false;
        $scope.operationRecord = false;
        $scope.chainAssets = false;
        userService.saveTab(3);
    };
    //注册资产
    $scope.registerAsset = function () {
    	
        if(!userService.issuerStatus){
            toastError($translate.instant('ISSUER_REG_NOT_COMPLETED'));
            return false;
        }
//      var reg = /^[A-Z]{3,6}$/;
//      if(!reg.test($scope.publishName)){
//          toastError('请输入3-6位大写字母');
//          return false;
//      }
        if(!$scope.publishName){
        	return toast($translate.instant('ASSET_NAME_NEEDED'));
        }
        if(!$scope.currencySet){
        	return toast($translate.instant('ASSET_CURRENCY_NEEDED'));
        }
        if(!$scope.estimatePrice){
        	return toast($translate.instant('ESTIMATE_PRICE_NEEDED'));
        }
        if(!$scope.estimateUnit){
        	return toast($translate.instant('ESTIMATE_UNIT_NEEDED'));
        }
        if(!$scope.unlockCondition){
        	return toast($translate.instant('UNLOCK_CONDITION_NEEDED'));
        }
        if(!$scope.exerciseUnit){
        	return toast($translate.instant('EXERCISE_UNIT_NEEDED'));
        }
        if(!$scope.publishDesc) {
            return toastError($translate.instant('ASSET_DESC_NEEDED'));
        }
        if(!$scope.selectedLevelOne){
    		return toast($translate.instant('ASSET_CATEGORY_NEEDED'));
    	}
        var name = $scope.publishName;
        var currency = $scope.chainCheck ? $scope.currencySet : $scope.monname +'.'+ $scope.currencySet;
        var estimatePrice = $scope.estimatePrice;
        var estimateUnit = $scope.estimateUnit;
        var unlockCondition = Number($scope.unlockCondition.value);
        var exerciseUnit = $scope.exerciseUnit;
        var desc = $scope.publishDesc;
        var maximum = $scope.topLimt;
        var precision = Number($scope.precision);
        var realMaximum = parseInt(maximum) * Math.pow(10, precision);
        if (!parseInt(maximum)) {
            return toastError($translate.instant('INCORRECT_ISSUING_AMOUNT'));
        }
        if (!precision ||precision < 0 || precision > 16) {
            return toastError($translate.instant('INCORRECT_PRECISION'));
        }
        if (String($scope.precision).indexOf('.') != -1) {
            return toastError($translate.instant('PRECISION_STANDARD'));
        }
        if (!userService.secondPublicKey) {
            $scope.regAssetSecondPassword = '';
        }else{
        	if(!$scope.regAssetSecondPassword){
        		return toast($translate.instant('SECOND_PWD_NEEDED'));
        	}
        };
        var extra = JSON.stringify({
		    "productBrand": {
		    	"value":$scope.productBrand,
		    	"remark":$scope.productBrandRemark,
		    	"link":$scope.productBrandLink
		    },
		    "packingStandard": {
		    	"value":$scope.packingStandard,
		    	"remark":$scope.packingStandardRemark,
		    	"link":$scope.packingStandardLink
		    },
		    "productIndex": {
		    	"value":$scope.productIndex,
		    	"remark":$scope.productIndexRemark,
		    	"link":$scope.productIndexLink
		    },
		    "productionInfo": {
		    	"value":$scope.productionInfo,
		    	"remark":$scope.productionInfoRemark,
		    	"link":$scope.productionInfoLink
		    },
		    "otherInfo": {
		    	"value":$scope.otherInfo,
		    	"remark":$scope.otherInfoRemark,
		    	"link":$scope.otherInfoLink
		    },
		    "moreDetails":$scope.moreDetails
		})
		var payload = {
		    name: name,
		    currency: currency,
		    desc: desc,
		    category: selwrapStr,
		    precision: precision,
		    maximum: realMaximum.toString(),
		    estimateUnit: estimateUnit,
		    estimatePrice: estimatePrice,
		    exerciseUnit: exerciseUnit,
		    unlockCondition: unlockCondition,
		    extra: extra
		}
		$scope.assetTrs = AschJS.uia.createAsset(payload, userService.secret, $scope.regAssetSecondPassword);
        $scope.dialogNUM = 2;
        $scope.comfirmDialog = true;
        $rootScope.isBodyMask = true;
    };
    //我的资产tab
    $scope.myAssetschange = function () {
        $scope.assetprofile = false;
        $scope.registerpublish = false;
        $scope.registerasset = false;
        $scope.myAssets = true;
        $scope.operationRecord = false;
        $scope.chainAssets = false;
        userService.saveTab(4);
        // if(!userService.issuerStatus){
        //     toastError('没有资产相关记录');
        //     return false;
        // }
        if($scope.myAss){
            $scope.myAss.reload();
        } else {
            $scope.myAss = new NgTableParams({
                page: 1,
                count: 10
            }, {
                total: 0,
                page: 1,
                count: 20,
                counts: [],
                getData: function ($defer, params) {
                    apiService.myAssets({
                        name: userService.name,
                        limit: params.count(),
                        offset: (params.page() - 1) * params.count()
                    }).success(function (res) {
                        params.total(res.count);
                        $defer.resolve(res.assets);
                        for (var i in res.assets) {
                            var precision = res.assets[i].precision;
                            res.assets[i].maximum = parseInt(res.assets[i].maximum) / Math.pow(10, precision);
                            res.assets[i].quantity = parseInt(res.assets[i].quantity) / Math.pow(10, precision);
                        }
                    }).error(function (res) {
                        toastError($translate.instant('ERR_SERVER_ERROR'));
                    });
                }
            });
        }

    };
    //链层资产tab
    $scope.chainAssetschange = function () {
        $scope.assetprofile = false;
        $scope.registerpublish = false;
        $scope.registerasset = false;
        $scope.myAssets = false;
        $scope.operationRecord = false;
        $scope.chainAssets = true;
        userService.saveTab(5);
        if($scope.chainAss){
            $scope.chainAss.reload();
        } else {
            $scope.chainAss = new NgTableParams({
                page: 1,
                count: 10
            }, {
                total: 0,
                page: 1,
                count: 20,
                counts: [],
                getData: function ($defer, params) {
                    apiService.myAssets({
                        name: "__SYSTEM__",
                        limit: params.count(),
                        offset: (params.page() - 1) * params.count()
                    }).success(function (res) {
                        params.total(res.count);
                        $defer.resolve(res.assets);
                        for (var i in res.assets) {
                            var precision = res.assets[i].precision;
                            res.assets[i].maximum = parseInt(res.assets[i].maximum) / Math.pow(10, precision);
                            res.assets[i].quantity = parseInt(res.assets[i].quantity) / Math.pow(10, precision);
                        }
                    }).error(function (res) {
                        toastError($translate.instant('ERR_SERVER_ERROR'));
                    });
                }
            });
        }

    };
    //操作记录
    /*
    $scope.operationRecordchange = function () {
        $scope.assetprofile = false;
        $scope.registerpublish = false;
        $scope.registerasset = false;
        $scope.myAssets = false;
        $scope.operationRecord = true;
        userService.saveTab(5);
        if($scope.operationRecordparams){
            $scope.operationRecordparams.reload()
        } else {
        $scope.operationRecordparams = new NgTableParams({
            page: 1,
            count: 20
        }, {
            total: 0,
            counts: [],
            getData: function ($defer,params) {
                apiService.myAssetTransactions({
                    address:userService.address,
                    orderBy: 't_timestamp:desc',
                    limit: params.count(),
                    offset: (params.page() - 1) * params.count()
                }).success(function (res) {
                    params.total(res.count);
                    $defer.resolve(res.transactions);
                }).error(function (res) {
                    toastError($translate.instant('ERR_SERVER_ERROR'));
                });
           }
        });
        }
    };
    //myWriteOff
    $scope.myWriteOff = function (i) {
        $scope.moneyName = i.name
        $rootScope.isBodyMask = true;
        $scope.myAss.writeoff = true;
    };
    $scope.writeoff_submit = function () {
        var currency = $scope.moneyName;
        var flagType = 2;
        var flag =1;
        if (!userService.secondPublicKey) {
            $scope.wosecondPassword = '';
        }
        var transaction = AschJS.uia.createFlags(currency, flagType, flag,userService.secret, $scope.wosecondPassword);
        postSerivice.writeoff(transaction).success(function (res) {
            if (res.success == true) {
                $scope.wosecondPassword = '';
                $scope.myAss.writeoff = false;
                $rootScope.isBodyMask = false;
                toast($translate.instant('INF_OPERATION_SUCCEEDED'));
            } else {
                toastError(res.error)
            };
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    }
    $scope.writeoffClose = function () {
        $rootScope.isBodyMask = false;
        $scope.myAss.writeoff = false;
    };
    */
    // // 发行
    $scope.myPublish = function (i) {
        $scope.assPublish = true;
        $scope.myPublishmoneyName = i.currency;
        $scope.currentAsset = i;
        $rootScope.isBodyMask = true;
    };
    $scope.chainPublish = function (i) {
        $scope.assPublish = true;
        $scope.myPublishmoneyName = i.currency;
        $scope.currentAsset = i;
        $rootScope.isBodyMask = true;
    };
    $scope.publish_submit = function () {
        $scope.assPublish = false;
        $rootScope.isBodyMask = false;
        if(!$scope.myPublishmoneyName){
            return ;
        }
        if (!$scope.amount) {
            return toastError($translate.instant('ISSUING_AMOUNT_NEEDED'));
        }
        if (!parseInt($scope.amount)) {
            return toastError($translate.instant('INCORRECT_ISSUING_AMOUNT'));
        }
        if (!$scope.exchangeRate) {
            return toastError($translate.instant('EXCHANGE_RATE_NEEDED'));
        }
        
        var realAmount = parseInt($scope.amount) * Math.pow(10, $scope.currentAsset.precision);
        var exchangeRate = $scope.exchangeRate.toString();
        var trs = AschJS.uia.createIssue($scope.myPublishmoneyName, String(realAmount), exchangeRate, userService.secret, $scope.pbsecondPassword);
        postSerivice.writeoff(trs).success(function (res) {
            if (res.success == true) {
                $scope.pbsecondPassword = '';
                $scope.exchangeRate = '';
                $scope.amount = '';
                $scope.assPublish = false;
                $rootScope.isBodyMask = false;
                toast($translate.instant('INF_OPERATION_SUCCEEDED'));
            } else {
                toastError(res.error)
            };
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    }
    $scope.publishClose = function () {
        $rootScope.isBodyMask = false;
        $scope.assPublish = false;
    };
    $scope.models = [
        { value: 0, name: '黑名单模式' },
        { value: 1, name: '白名单模式' }
    ];
    $scope.mymodel = $scope.models[1];

    // 设置
    $scope.mySettings = function (i) {
        $scope.moneyName = i.name;
        if(i.acl == 0){
            $scope.acl = 1;
        } else if (i.acl == 1){
            $scope.acl = 0;
        }

        $scope.myAss.set = true;
        $rootScope.isBodyMask = true;
    };
    $scope.settings_submit = function () {
        $scope.myAss.set = false;
        $rootScope.isBodyMask = false;
        var currency = $scope.moneyName;
        var flagType = 1;
        var flag = $scope.acl;
        if (!userService.secondPublicKey) {
            $scope.setsecondPassword = '';
        }
        var trs = AschJS.uia.createFlags(currency, flagType, flag, userService.secret, $scope.setsecondPassword);
        postSerivice.writeoff(trs).success(function (res) {
            if (res.success == true) {
                $scope.setsecondPassword = '';
                $scope.myAss.set = false;
                $rootScope.isBodyMask = false;
                toast($translate.instant('INF_OPERATION_SUCCEEDED'));
            } else {
                toastError(res.error)
            };
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    };
    $scope.settingsClose = function () {
        $rootScope.isBodyMask = false;
        $scope.myAss.set = false;
    };
    //关闭确认
    $scope.comfirmDialogClose = function () {
        $rootScope.isBodyMask = false;
        $scope.comfirmDialog = false;
    };
    $scope.comfirmSub = function () {
        var trs ;
        if($scope.dialogNUM == 1){
            trs = $scope.publishtrs;

        } else if($scope.dialogNUM == 2){
            trs = $scope.assetTrs;
        }
        postSerivice.post(trs).success(function (res) {
            if (res.success == true) {
                if($scope.dialogNUM == 1){
                    $scope.monname = '';
                    $scope.mondesc = '';
                    $scope.rpsecondPassword = '';
                    userService.isName($scope.monname);
                } else if($scope.dialogNUM == 2){
                    $scope.publishName = '';
                    $scope.currencySet = '';
                    $scope.estimatePrice = '';
                    $scope.estimateUnit = '';
                    $scope.unlockCondition = '';
                    $scope.exerciseUnit = '';
                    $scope.publishDesc = '';
                    $scope.topLimt = '';
                    $scope.precision = '';
                    $scope.rasecondPassword = '';
                    //extra
                    $scope.productBrand = '';
                    $scope.productBrandRemark = '';
                    $scope.productBrandLink = '';
                    $scope.packingStandard = '';
                    $scope.packingStandardRemark = '';
                    $scope.packingStandardLink = '';
                    $scope.productIndex = '';
                    $scope.productIndexRemark = '';
                    $scope.productIndexLink = '';
                    $scope.productionInfo = '';
                    $scope.productionInfoRemark = '';
                    $scope.productionInfoLink = '';
                    $scope.otherInfo = '';
                    $scope.otherInfoRemark = '';
                    $scope.otherInfoLink = '';
                }
                toast($translate.instant('INF_OPERATION_SUCCEEDED'));
                $scope.comfirmDialogClose();
            } else {
                toastError(res.error)
            }
        }).error(function (res) {
            toastError($translate.instant('ERR_SERVER_ERROR'));
        });
    };

    $scope.myAddPlus = function (i) {

        $rootScope.addACL = i;
        $location.path('/add-acl');
    };
    // //-ACL
    $scope.myreduceACL = function (i) {
        $rootScope.reduceACL = i;
        $location.path('/reduce-acl');
    };
    $scope.transferView= function (i,num) {
       var data ;
        if(num == 1){
            data = i.currency;
        } else if(num == 2){
            data = i.name;
        }
        $rootScope.currencyName = data;
        $rootScope.precision = i.precision;
        $location.path('/pay');
    };


});

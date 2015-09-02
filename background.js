/**
 * Number.prototype.format(n, x)
 *
 * @param integer n: length of decimal
 * @param integer x: length of sections
 */
Number.prototype.format = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,');
};

(function() {
	var _ = {
		url : 'http://shopping.naver.com/search/all_search.nhn?query=%ED%99%88%ED%94%8C%EB%9F%AC%EC%8A%A4%EB%94%94%EC%A7%80%ED%84%B8%EC%83%81%ED%92%88%EA%B6%8C&pagingIndex=1&pagingSize=40&productSet=total&viewType=list&searchBy=none&sort=rel&cat_id=50000009&minPrice=9000&maxPrice=500000&frm=NVSHPRC',
		items : [],
		_xhr : null,
		loadHandler : function(useAlert, e) {
			var list = this._xhr.responseXML.querySelectorAll(".goods_list li._product_list");//, .goods_list li._model_list");
			list = Array.prototype.slice.call(list);
			this.items.length=0;

			list.forEach(function(v,i,a, ht, pos10, elInfo, elLink) {
			    elInfo = v.querySelector(".info");
			    elLink = elInfo.querySelector("a");
			    if(elLink.innerText.indexOf("디지털") != -1) {
			        ht = {
			            "price" : parseInt(elInfo.querySelector(".price .num").innerText.replace(/,/g,""),10),
			            "link" : elLink.getAttribute("href"),
			            "mall" : v.querySelector(".info_mall a.mall_more").getAttribute("title")
			        };
			        // calculate sale percent
			        pos10 = Math.pow(10,String(ht.price).length-1);
			        pos10 = pos10 < 0 ? 0 : pos10;
			        ht.orgPrice = Math.round(ht.price/pos10)* pos10;
			        ht.sale = Number((100 - (ht.price/ht.orgPrice * 100)).toFixed(2));
			        this.items.push(ht);
					// console.info(v, this.items[this.items.length-1].sale);
			    }
			},this);

			// sort
			this.items = this.items.sort(function(a,b) {
			    return b.sale - a.sale;
			});
			console.info("target",this.items);
			var itemMsg = [];

			if(this.items.length > 0) {
				this.items.forEach(function(v,i,a) {
					itemMsg.push({
						"title" : v.mall,
						"message" : v.price.format() + " (" + v.sale + "%)"
					});
				});
			    	chrome.browserAction.setBadgeText({
					text: _.items[0].sale + "%"
				});

				(_.items[0].sale > 6 || useAlert) && chrome.notifications.create("homeplus-nofi",{
					type: "list",
					iconUrl: "logo.png",
					title: "홈플러스 디지털 상품권",
					message: "",
					items: itemMsg,
					buttons : [ {title : "최저가로 이동"}, {title : "검색 결과로 이동"} ],
					priority: 0
				},
				function() { /* Error checking goes here */} );
			}
		},
		run : function(useAlert) {
			this._xhr = new XMLHttpRequest();
			this._xhr.open('GET', this.url, true);
			this._xhr.responseType = 'document';
			this._xhr.onload = this.loadHandler.bind(this, useAlert);
			this._xhr.send();
		}
	};


	// event attach!
	chrome.browserAction.onClicked.addListener(function(e) {
		chrome.notifications.clear("homeplus-nofi", function(e) {
			_.run(true);
		});
	});

	chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
	chrome.notifications.onButtonClicked.addListener(function(id, btIndex) {
		if(id == "homeplus-nofi") {
			var args = {
				"selected" : true
			};
			if(btIndex == 0) {
				args.url = _.items[0].link;
			} else if(btIndex ==1 ) {
				args.url = _.url;
			}
			chrome.tabs.create(args);
		}
	});

	chrome.runtime.onInstalled.addListener(_.run.bind(_, false));
	chrome.alarms.create('find-homeplus.refresh', {periodInMinutes:3});
	chrome.alarms.onAlarm.addListener(_.run.bind(_, false));
})();
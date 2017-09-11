require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
	var $dialogEdit = top.fly.dialog.list['dialogEdit'],
		itemId = $dialogEdit.options.objId;
	var vm = window.vm = fly.observable({
		item: [],
		editable: false,
		system: fly.dataSource({
			read: {
				url: 'http://localhost:8080/audit-backend/dictionary/getBusinessSystem',
				dataType: 'json',
				type: 'GET',
				dataFilter: function(res) {
					var res = fly.evalJSON(res);
					if (res.length > 0) {
						return JSON.stringify(res);
					}
				}
			}
		}),
		sureClick: function() {
			$dialogEdit.close().destroy();
		}
	});
	fly.bind('body', vm);
	$.ajax({
		type: "POST",
		url: "http://localhost:8080/audit-backend/log/getLogById",
		data: {
			logId: itemId
		},
		success: function(res) {
			var res = fly.evalJSON(res);
			res.operateTime = formatDate(res.operateTime, 'yyyy-MM-dd hh:mm:ss');
			vm.set('item', res);
		}
	});

	function formatDate(e, format) {
		//e为不满足格式的日期，format为格式
		date = new Date(e);
		var map = {
	        "M": date.getMonth() + 1, //月份
	        "d": date.getDate(), //日
	        "h": date.getHours(), //小时
	        "m": date.getMinutes(), //分
	        "s": date.getSeconds() //秒
	    };
	    format = format.replace(/([yMdhmsqS])+/g, function(all, t) {
	        var v = map[t];
	        if(v !== undefined){
	            if(all.length > 1){
	                v = '0' + v;
	                v = v.substr(v.length-2);
	            }
	            return v;
	        }
	        else if(t === 'y'){
	            return (date.getFullYear() + '').substr(4 - all.length);
	        }
	        return all;
	    });
	    return format;
	 }
});
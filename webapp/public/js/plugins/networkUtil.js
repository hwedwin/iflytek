define(['jquery'], function($) {
	return {
		ajaxGet: function(url, data, success, complete) {
			data = data ? JSON.stringify(data) : {};
			$.ajax({
				url: url || '',
				dataType: 'json',
				data: data,
				type: 'GET',
				success: function(res) {
					if(typeof success === 'function') {
						success(res);
					}
				},
				complete: function(msg) {
					if(typeof complete === 'function') {
						complete(msg);
					}
				}
			});
		},
		ajaxPost: function(url, data, success, complete) {
			data = data ? JSON.stringify(data) : {};
			$.ajax({
				url: url || '',
				dataType: 'json',
				data: data,
				type: 'POST',
				success: function(res) {
					if(typeof success === 'function') {
						success(res);
					}
				},
				complete: function(msg) {
					if(typeof complete === 'function') {
						complete(msg);
					}
				}
			});
		},
		highLight: function (idVal, keyword, color) {
			//高亮显示,idVal为需要高亮显示的选择属性
            //g(全文查找出现的所有pattern),i(忽略大小写)
            var hlValue = new RegExp("(" + keyword + ")", "gi");
            var items = document.querySelectorAll(idVal);
            for (var i = 0; i < items.length; i++) {
                var element = items[i];
                element.innerHTML = (element.innerHTML).replace(hlValue, "<font color=" + color + ">$1</font>");
            }
        }
	}
});
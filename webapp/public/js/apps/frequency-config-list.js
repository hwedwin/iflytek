require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
	var vm = window.vm = fly.observable({
		tableData: fly.dataSource({
			read: {
				url: 'http://localhost:8080/audit-backend/frequency/getFrequencyList',
				type: 'POST',
				dataType: 'json',
				dataFilter: function(res) {
					var res = fly.evalJSON(res),
						data = {
							rows: res.rows || [],
							total: res.total || 0
						}
					if (res.rows.length <= 0) {
						$('#gridList').html('<tr><td colspan="7">暂无数据</td></tr>');
					}
					res.rows.forEach(function(item, i) {
						if(item.statisType == '4001'){
							item.statisValue = item.statisValue + '%';
						} else if(item.statisType == '4002') {
							item.statisValue = item.statisValue + '次';
						}
					});
					return JSON.stringify(data);
				}
			},
			pageSize: 5
		})
	});
	fly.bind('body', vm);

});
require.config(requireConfig);
require(['jquery', 'fly', 'networkUtil', 'multisel'], function ($, fly, net){
	var formData = {},
		vm = window.vm = fly.observable({
				optionType: fly.dataSource({
					read: {
						url: '/public/mock/option-types.json',
						dataType: 'json',
						type: 'GET',
						dataFilter: function(res) {
							var res = fly.evalJSON(res);
							if(res.flag) {
								return JSON.stringify(res.result);
							}else {
								fly.alert(res.msg);
							}
						}
					}
				}),
				system: fly.dataSource({
					read: {
						url: '/public/mock/business-systems.json',
						dataType: 'json',
						type: 'GET',
						dataFilter: function(res) {
							var res = fly.evalJSON(res);
							if(res.flag) {
								return JSON.stringify(res.result);
							}else {
								fly.alert(res.msg);
							}
						}
					}
				}),
				searchVal:'',
				systemVal: '',
				optionTypeVal: '',
				tableData: fly.dataSource({
					read: {
						url: '/public/mock/search-results.json',
						type: 'GET',
						dataType: 'json',
						dataFilter: function(res) {
							var res = fly.evalJSON(res),
								data = {
									rows: res.result.data || [],
									total: res.result.total || 0
								}
							if(!res.flag || res.result.data.length) {
								$('#gridList').html('<tr><td colspan="8">暂无数据</td></tr>');
							}
							return JSON.stringify(data);
						}
					},
					pageSize: 5
				}),
				searchClick: function(e) {
					var formData = e.handleObj.data,
						data = {};
					data.optionId = formData.optionTypeVal;
					data.search = formData.searchVal;
					data.systemId = formData.systemVal;
					//存放查询的表单条件
					formData = data;
					//在有查询条件的情况下执行下一页或者执行选中页码的操作，需要限满足的条件，设置read的筛选条件
					vm.tableData.options.read.data = formData;
					//根据查询条件请求请求只符合满足条件的列表数据
					console.log('查询条件:' + JSON.stringify(data));
					//根据条件查询之后，将页码设置为第一页，否则内容和页码对应不上
					vm.tableData.page(1);
				}
		});
	fly.bind('body',vm);
});
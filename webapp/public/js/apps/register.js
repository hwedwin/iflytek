require.config(requireConfig);
require(['jquery', 'fly'], function($, fly) {
	var vm = window.vm = fly.observable({
		comfirm_password: '',
		password: '',
		register: function() {
			var $form = $('#formWrap').flyForm({
					valid: {
						userName: {
							required: true,
							title: '用户名',
							check: function(e) {
								var val = this.val();
								if (val.length > 20) {
									this.flyTooltip({
										content: '用户名最长不超过20个字符'
									});
									return false;
								}
								return val;
							}
						},
						password: {
							required: true,
							type: 'password',
							title: '密码'
						},
						comfirm_password: {
							required: true,
							title: '确认密码'
						},
						phone: {
							title: '电话',
							pattern: '^1[3|4|5|7|8][0-9]{9}$'
						},
						email: {
							title: '邮箱',
							pattern: '^([0-9A-Za-z\-_\.]+)@([0-9a-z]+\.[a-z]{2,3}(\.[a-z]{2})?)$'
						}
					}
				}),
				data = $form.data('flyForm').data();
			if (!data) {
				return;
			}
			if (vm.get('comfirm_password') != vm.get('password')) {
				$('#comfirm_password').flyTooltip({
					content: '两次密码输入不一致'
				});
				return;
			}
			$.ajax({
				type: "POST",
				url: "http://localhost:8080/audit-backend/user/register",
				data: data,
				success: function(res) {
					var res = fly.evalJSON(res);
					if (res.code == '1') {
						fly.alert('注册成功');
						//注册成功，返回的注册的用户信息
						var userName = res.data.userName;
						setTimeout(function() {
							window.location.href = '/views/login.html?userName=' + userName;
						},1000);
					} else {
						fly.alert('注册失败');
					}
				}
			});
		},
		goBack: function() {
			window.history.back();
		}
	});
	fly.bind('body', vm);
});
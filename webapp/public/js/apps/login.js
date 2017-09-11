require.config(requireConfig);
require(['jquery', 'fly'], function ($, fly) {
	var userName = fly.utils.getQueryString('userName');
	var	vm = window.vm = fly.observable({
		userName: userName,
		password: '',
		login: function() {
			var $form = $('#formWrap').flyForm({}),
			data = $form.data('flyForm').data();
			if(!data) {
				return;
			}
			$.ajax({
				type: "POST",
				url: "http://localhost:8080/audit-backend/user/loginSubmit",
				data: data,
				success: function(res) {
					var res = fly.evalJSON(res);
					if(res.code == '0') {
						fly.alert('用户名或用户密码不正确');
					} else {
						sessionStorage.setItem("user", JSON.stringify(res.data));
						window.location.href = '/views/index.html';
					}
				}
			});
		},
		goRegister: function() {
			window.location.href = '/views/register.html';
		}
	});
	fly.bind('body', vm);
});
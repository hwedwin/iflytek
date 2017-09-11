package com.iflytek.audit.service;

import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iflytek.audit.common.CodeUtil;
import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.ListWarnDao;
import com.iflytek.audit.entity.ListWarn;

/**
 * 名单预警service层
* @ClassName: ListWarnService 
* @Description: TODO(这里用一句话描述这个类的作用) 
* @author 曹庭旺 
* @date 2017年9月7日 下午12:06:03 
*
 */
@Service("listWarnService")
public class ListWarnService {

	@Autowired
	private ListWarnDao listWarnDao;

	@Autowired
	private DictionaryService dictionaryService;

	/**
	 * 添加预警信息
	 * 
	 * @method: addListWarn
	 * @param:listWarn前端传过来的信息，除了表格总填写的，还要填写人的id
	 * @return ListWarn
	 */
	public ListWarn addListWarn(ListWarn listWarn) {
		listWarn.setIsDelete(0);
		listWarn.setWarnNum(CodeUtil.randomCode());
		listWarn.setCreateTime(new Date());
		listWarn.setModifyTime(new Date());
		listWarn.setModifyUserId(listWarn.getCreateUserId());
		listWarnDao.addObject(listWarn);
		return listWarn;
	}

	/**
	 * 按照条件分页
	 * 
	 * @param listWarn
	 * @param page
	 * @return 返回分页数据
	 */
	public PageVo<ListWarn> getListWarn(ListWarn listWarn, PageVo<ListWarn> page) {
		return listWarnDao.getRowsByPage(listWarn, page);
	}

	/**
	 * 删除名单预警信息，将是否删除标志位改为1
	* @method: deleteListWarn
	* @param:ids要删除的名单预警的id
	* @return Boolean
	 */
	public Boolean deleteListWarn(int[] ids) {
		Boolean flag = true;
		for (int i : ids) {
			ListWarn listWarn = listWarnDao.getObjectById(i);
			listWarn.setIsDelete(1);
			Boolean f = listWarnDao.updateObject(listWarn);
			if (f) {
				flag = f;
			}
		}
		return flag;
	}

	/**
	 * 根据id获得名单预警信息
	* @method: getListWarnById
	* @param:名单预警的id
	* @return ListWarn
	 */
	public ListWarn getListWarnById(Integer id) {
		ListWarn listWarn = listWarnDao.getObjectById(id);
		listWarn.setOptionTypeValue(dictionaryService.getValueByKey(listWarn.getOptionType()));
		listWarn.setBusinessSystemValue(dictionaryService.getValueByKey(listWarn.getBusinessSystem()));
		return listWarn;
	}

	/**
	 * 修改名单预警信息
	* @method: updateListWarn
	* @param:要修改的名单预警的信息
	* @return Boolean
	 */
	public Boolean updateListWarn(ListWarn listWarn) {
		ListWarn db = listWarnDao.getObjectById(listWarn.getId());
		db = listWarnDao.mergeT(db, listWarn);
		db.setModifyTime(new Date());
		return listWarnDao.updateObject(db);
	}
}

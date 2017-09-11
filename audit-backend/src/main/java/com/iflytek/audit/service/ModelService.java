package com.iflytek.audit.service;

import java.util.Date;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iflytek.audit.common.CodeUtil;
import com.iflytek.audit.common.PageVo;
import com.iflytek.audit.dao.ModelDao;
import com.iflytek.audit.entity.Model;

/**
 * 模型serivce层
* @ClassName: ModelService 
* @Description: TODO(这里用一句话描述这个类的作用) 
* @author 曹庭旺 
* @date 2017年9月7日 下午12:06:25 
*
 */
@Service("modelService")
public class ModelService {
	
	@Autowired
	public ModelDao modelDao;
	
	@Autowired
	public DictionaryService dictionaryService;
	
	/**
	 * 模型条件分页
	* @method: getModelByPage
	* @param:
	* @return PageVo<Model>
	 */
	public PageVo<Model> getModelByPage(Model model, PageVo<Model> page) {
		page = modelDao.getRowsByPage(model, page);
		List<Model> models = page.getRows();
		for (Model m : models) {
			String[] reminds = m.getRemindWay().split(",|，");
			String remindWays = "";
			if(!"".equals(reminds[0])) {
				for (int i = 0; i < reminds.length; i++) {
					Integer key = Integer.valueOf(reminds[i]);
					remindWays += " " + dictionaryService.getValueByKey(key);
				}
				m.setRemindWay(remindWays);			
			}
		}
		return page;
	}

	/**
	 * 添加模型信息
	* @method: addModel
	* @param:
	* @return Model
	 */
	public Model addModel(Model model) {
		model.setModelNum(CodeUtil.randomCode());
		model.setCreateTime(new Date());
		model.setIsDelete(0);
		modelDao.addObject(model);
		return model;
	}

	/**
	 * 删除模型信息
	* @method: deleteModel
	* @param:
	* @return Model
	 */
	public Model deleteModel(Integer modelId) {
		Model model = modelDao.getObjectById(modelId);
		model.setIsDelete(1);
		Boolean flag = modelDao.updateObject(model);
		return flag ? model : null;
	}
	
	/**
	 * 获得提醒方式
	* @method: getRemindWay
	* @param:
	* @return PageVo<Model>
	 */
	public PageVo<Model> getRemindWay(PageVo<Model> page) {
		return modelDao.getRemindWay(page);
	}

	/**
	 * 更新提醒方式
	* @method: updateRemindWay
	* @param:
	* @return Boolean
	 */
	public Boolean updateRemindWay(List<Model> models) {
		return modelDao.updateRemindWay(models);
	}
}

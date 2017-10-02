<HTML>
<HEAD>
<TITLE>Calling a function from within another function</TITLE>
<SCRIPT LANGUAGE="JavaScript">
<!-- hide script contents from old browsers

function makeBar() {
  var output = "<HR ALIGN='left' WIDTH=400>"
  document.write(output)
}

function makeHeader(text, color, size) {
  var output = "<FONT COLOR='" + color + "' SIZE=" +
  size + ">" + text + "</FONT>"
  makeBar()
 document.write(output)
  makeBar()
}

makeHeader("JavaScript Examples", "red", "+4")

// end hiding contents from old browsers  -->
</SCRIPT>
</HEAD>
<BODY>
</BODY>
</HTML>
Table	
task
Field	
u_environment
Type	
glide_list
Reference	
cmdb_ci_environment
Reference Qual	
javascript:new wsp_SI_ChangeUtils().getRefQualEnvironment(current.requested_by)
Max Length	
1024
Attributes	
no_sort=true,​slushbucket_ref_no_expand=true


javascript:new wsp_SI_ChangeUtils().getRefQualEnvironment(current.requested_by)



/*

 *Author:*
Jürgen Fehse (juergen.fehse@wsp-consulting.de)

 *Company:*
WSP-Consulting GmbH

 *Date created:*
2014-01-29

 *Description:*
Utilities for change
 */

gs.include("JSUtil");
gs.include("JSON");
var wsp_SI_ChangeUtils = Class.create();
wsp_SI_ChangeUtils.prototype = Object.extendsObject(AbstractAjaxProcessor, {
	/*
	Function: sendChangeInformations
	Sends a Mail with all Change Request informations to the current user
	
 	*Author:*
	Maik Schamber (maik.schamber@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2015-01-23
	
	Parameters:
	change_number - number of change request
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	sendChangeInformationsAjax: function(){
		var change_number = this.getParameter('sysparm_number');
		
		return this.sendChangeInformations(change_number);
		
	},
	
	/*
	Function: sendChangeInformations
	Sends a Mail with all Change Request informations to the current user
	
 	*Author:*
	Maik Schamber (maik.schamber@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2015-01-23
	
	Parameters:
	change_number - number of change request
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	sendChangeInformations: function(change_number){
		var user_id = gs.getUserID();
		var memberIn = [];
		
		var grMember = new GlideRecord('sys_user_grmember');
		grMember.addQuery('user', user_id);
		grMember.query();
		while(grMember.next()){
			memberIn.push(grMember.group + "");
		}
		
		var grChange = new GlideRecord('change_request');
		grChange.addQuery('number', change_number);
		grChange.addQuery('watch_list', user_id)
		.addOrCondition('opened_by', user_id)
		.addOrCondition('requested_by', user_id)
		.addOrCondition('assignment_group', 'IN', memberIn.join(','));
		grChange.query();
		if(grChange.next()){
			
			gs.eventQueue("change_request.send_information", grChange, gs.getUserID(), gs.getUserName());
			
			return gs.getMessage('<br />Information regarding change request '+ change_number + ' has been sent to your email address!');
		}
		return gs.getMessage('<br />You do not have sufficient privileges to request information about the change request ' + change_number + '! Please contact NOC Team for further information');
	},
	
	/*
	Function: getInfoGrpMembers
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-29
	
	Parameters:
	sysparm_impacted_service – Impacted Business Service from Incident (string)
	sysparm_affected_ci – Affected Configuration Item (string)
	
	Returns:
	List of info group members.
	
	See Also:
 	*/
	getAllInfoGrpMembers : function() {
		var aResult = [];
		var result = "";
		
		try {
			var impactedService = this.getParameter('sysparm_impacted_service').toString();
			var affectedCI = this.getParameter('sysparm_affected_ci').toString();
			var aCISysIds = [];
			
			if (impactedService != "") {
				aCISysIds.push(impactedService);
			}
			if (affectedCI != "") {
				aCISysIds.push(affectedCI);
			}
			
			var grCI = new GlideRecord('cmdb_ci');
			grCI.addEncodedQuery('sys_idIN' + aCISysIds.join(','));
			grCI.query();
			
			while (grCI.next()) {
				if (grCI.u_info_group.toString() != "") {
					aResult.push(this.__getInfoGroupMembers(grCI.u_info_group));
				}
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
		
		return aResult.join(',');
	},
	/*
	Function:
	populateAffectedCIList
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-30
	
	Parameters:
	incSysId – incident sys_id (string)
	ciSysId - ci sys_id
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	populateAffectedCIList : function(chgSysId, impactedServiceId, affectedServiceId) {
		try {
			var aCIList = this.getDependingCIs(impactedServiceId, affectedServiceId);			
			var grTaskCI = new GlideRecord('task_ci');
			grTaskCI.addQuery('task', chgSysId);
			grTaskCI.addQuery('ci_item', '!=', affectedServiceId);
			grTaskCI.query();
			
			while (grTaskCI.next()) {
				grTaskCI.deleteRecord();
			}
			
			for (var i = 0; i < aCIList.length; i++) {
				grTaskCI = new GlideRecord('task_ci');
				grTaskCI.initialize();
				grTaskCI.task = chgSysId;
				grTaskCI.ci_item = aCIList[i];
				grTaskCI.insert();
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: populateImpactedServiceList
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-30
	
	Parameters:
	incSysId – incident sys_id (string)
	ciSysId - ci sys_id (string)
	impactedServiceId - impacted service sys_id (string)
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	populateImpactedServiceList: function(chgSysId, affectedServiceId, impactedServicId) {
		try {
			var addImpService = true;
			var aServiceList = this.getDependingServices(impactedServicId);
			var grTaskService = new GlideRecord('task_cmdb_ci_service');
			grTaskService.addQuery('task', chgSysId);
			grTaskService.addQuery('manually_added', false);
			
			grTaskService.query();
			
			while (grTaskService.next()) {
				grTaskService.deleteRecord();
			}
			
			for (var i = 0; i < aServiceList.length; i++) {
				grTaskService = new GlideRecord('task_cmdb_ci_service');
				grTaskService.initialize();
				grTaskService.task = chgSysId;
				grTaskService.cmdb_ci_service = aServiceList[i];
				grTaskService.manually_added = false;
				grTaskService.insert();
				
				if (aServiceList[i] == impactedServicId) {
					addImpService = false;
				}
			}
			
			// Add Impacted Service from incident form
			if (addImpService) {
				grTaskService = new GlideRecord('task_cmdb_ci_service');
				grTaskService.initialize();
				grTaskService.task = chgSysId;
				grTaskService.cmdb_ci_service = impactedServicId;
				grTaskService.manually_added = false;
				grTaskService.insert();
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: populateAffectedCustomerList
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-31
	
	Parameters:
	incSysId – incident sys_id (string)
	ciSysId - ci sys_id (string)
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	populateAffectedCustomerList : function(chgSysId, ciSysId) {
		try {
			// Only if no manually list entrys
			/*if (this.isManuallyAddedAffectedCustomer(incSysId)) {
				return false;
			}*/
			
			var aCustomerList = this.getDependingCustomer(ciSysId);
			var grTaskCustomer = null;
			this.deleteAffectedCustomerList(chgSysId);
			
			for (var i = 0; i < aCustomerList.length; i++) {
				grTaskCustomer = new GlideRecord('u_task_cmdb_ci_customer');
				grTaskCustomer.initialize();
				grTaskCustomer.u_task = chgSysId;
				grTaskCustomer.u_customer = aCustomerList[i];
				grTaskCustomer.u_manually_added = false;
				grTaskCustomer.insert();
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: deleteAffectedCustomerList
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-04-09
	
	Parameters:
	incSysId – incident sys_id (string)
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	deleteAffectedCustomerList : function(chgSysId) {
		var grTaskCustomer = new GlideRecord('u_task_cmdb_ci_customer');
		grTaskCustomer.addQuery('u_task', chgSysId);
		//grTaskCustomer.addQuery('u_manually_added', false);
		grTaskCustomer.query();
		
		while (grTaskCustomer.next()) {
			grTaskCustomer.deleteRecord();
		}
	},
	/*
	Function: insertAffectedCustomerList
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-05
	
	Parameters:
	incSysId – incident sys_id (string)
	affectedCustomerList - sys_id list with affected customers (string)
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	insertAffectedCustomerList : function(chgSysId, affectedCustomerList) {
		try {
			var aCustomerList = affectedCustomerList.toString().split(',');
			
			for (var i = 0; i < aCustomerList.length; i++) {
				grTaskCustomer = new GlideRecord('u_task_cmdb_ci_customer');
				grTaskCustomer.initialize();
				grTaskCustomer.u_task = chgSysId;
				grTaskCustomer.u_customer = aCustomerList[i];
				grTaskCustomer.insert();
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: insertAffectedProviderList
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-03-12
	
	Parameters:
	incSysId – incident sys_id (string)
	affectedProviderList - sys_id list with affected providers (string)
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	insertAffectedProviderList : function(chgSysId, affectedProviderList) {
		try {
			var aProviderList = affectedProviderList.toString().split(',');
			
			for (var i = 0; i < aProviderList.length; i++) {
				grTaskProvider = new GlideRecord('u_task_cmdb_ci_provider');
				grTaskProvider.initialize();
				grTaskProvider.u_task = chgSysId;
				grTaskProvider.u_provider = aProviderList[i];
				grTaskProvider.insert();
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: isManuallyAddedAffectedCustomer
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-03
	
	Parameters:
	incSysId – incident sys_id (string)
	
	Returns:
	True if at least one customer is manually added to relation list, otherwise
	false.
	
	See Also:
 	*/
	isManuallyAddedAffectedCustomer : function(chgSysId) {
		var grCheck = new GlideRecord('u_task_cmdb_ci_customer');
		grCheck.addQuery('u_task', chgSysId);
		grCheck.addQuery('u_manually_added', true);
		grCheck.query();
		
		if (grCheck.hasNext()) {
			return true;
		} else {
			return false;
		}
	},
	/*
	Function: getDependingCIs
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-30
	
	Parameters:
	ciSysId – sys_id of current affected ci (string)
	incCount - current incrementel counter (integer)
	
	Returns:
	Array of related ci sys_id's
	
	See Also:
 	*/
	getDependingCIs : function(ciSysId, affectedServiceId) {
		try {
			
			var aResult = [];
			var aParentCis = [];
			var grRel = new GlideRecord('cmdb_rel_ci');
			var oIgnoreClasses = {
				cmdb_ci_service : true,
				cmdb_ci_environment : true,
				u_cmdb_ci_customer : true
			};
			
			// Check arguments
			gs.log('ciSysId: ' + ciSysId);
			ciSysId = typeof ciSysId != 'undefined' ? ciSysId : this.getParameter('sysparm_ciSysId').toString();
			chgCount = typeof chgCount != 'undefined' ? chgCount : 0;
			
			// Build Query
			grRel.addQuery('parent', ciSysId);
			grRel.query();
			chgCount++;
			
			// Loop over all cis
			while (grRel.next()) {	
				if (!oIgnoreClasses[grRel.child.sys_class_name] && grRel.child.sys_id != affectedServiceId) {
					aResult.push(grRel.child.toString());
				}					
			}
			var arrayUtil = new ArrayUtil();
			return arrayUtil.unique(aResult);
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getDependingServices
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-30
	
	Parameters:
	ciSysId – sys_id of current affected ci (string)
	incCount - current incrementel counter (integer)
	
	Returns:
	Array of related services sys_id's
	
	See Also:
 	*/
	getDependingServices : function(ciSysId) {
		try {
			var aResult = [];
			var aParentServices = [];
			var grRel = new GlideRecord('cmdb_rel_ci');			
			// Check arguments
			ciSysId = typeof ciSysId != 'undefined' ? ciSysId : this.getParameter('sysparm_ciSysId').toString();
			chgCount = typeof chgCount != 'undefined' ? chgCount : 0;
			
			// Build Query
			grRel.addQuery('parent', ciSysId);
			grRel.query();
			// Loop over all cis
			while (grRel.next()) {
				// If no parent ci's push current parent, else push current
				// and parent ci's
				var className = grRel.child.getRefRecord().sys_class_name;
				if (className == 'cmdb_ci_service') {
					aResult.push(grRel.child.toString());
				}				
			}
			var arrayUtil = new ArrayUtil();
			return arrayUtil.unique(aResult);
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getDependingCustomer
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-30
	
	Parameters:
	ciSysId – sys_id of current affected ci (string)
	incCount - current incrementel counter (integer)
	
	Returns:
	Array of related customer sys_id's
	
	See Also:
 	*/
	getDependingCustomer : function(ciSysId, chgCount) {
		try {
			var aResult = [];
			var aParentCustomer = [];
			var grRel = new GlideRecord('cmdb_rel_ci');
			
			// Check arguments
			ciSysId = typeof ciSysId != 'undefined' ? ciSysId : this.getParameter('sysparm_ciSysId').toString();
			chgCount = typeof chgCount != 'undefined' ? chgCount : 0;
			
			// Build Query
			grRel.addQuery('child', ciSysId);
			grRel.query();
			chgCount++;
			
			// Loop over all cis
			while (grRel.next()) {
				// Inc call
				aParentCustomer = this.getDependingCustomer(grRel.parent, chgCount);
				
				// If no parent ci's push current parent, else push current
				// and parent ci's
				if (aParentCustomer.length == 0) {
					if (grRel.parent.sys_class_name == 'u_cmdb_ci_customer') {
						aResult.push(grRel.parent.toString());
					}
				} else {
					if (grRel.parent.sys_class_name == 'u_cmdb_ci_customer') {
						aResult.push(grRel.parent.toString());
					}
					for (var i = 0; i < aParentCustomer.length; i++) {
						aResult.push(aParentServices[i]);
					}
				}
			}
			return aResult;
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getEnvironments
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-05
	
	Parameters:
	
	Returns:
	Object with all environment. Key = environment name.
	
	See Also:
 	*/
	getEnvironments : function() {
		try {
			var oResult = {};
			var gr = new GlideRecord('cmdb_ci_environment');
			gr.query();
			
			while (gr.next()) {
				oResult[gr.name.toString()] = gr.sys_id.toString();
			}
			
			// + Fixe Environments
			oResult['corporate_it'] = 'f1c4585d6f6651002c8ba8ff8d3ee49b';
			oResult['mtest'] = 'e7a41c5d6f6651002c8ba8ff8d3ee4d0';
			oResult['other'] = '9e941c5d6f6651002c8ba8ff8d3ee4cc';
			oResult['production'] = 'cc54585d6f6651002c8ba8ff8d3ee4f6';
			
			return oResult;
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getBusinessCriticality
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-11
	
	Parameters:
	
	Returns:
	Business criticality.
	
	See Also:
 	*/
	getBusinessCriticality : function(sys_id) {
		try {
			sys_id = typeof sys_id != 'undefined' ? sys_id : this.getParameter('sysparm_sys_id').toString();
			var result = '';
			var gr = new GlideRecord('cmdb_ci_service');
			gr.addQuery('sys_id', sys_id);
			gr.query();
			
			while (gr.next()) {
				result = gr.busines_criticality;
			}
			
			return result;
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getBusinessServiceLocation
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-17
	
	Parameters:
	
	Returns:
	Business location.
	
	See Also:
 	*/
	getBusinessServiceLocation : function(sys_id) {
		try {
			sys_id = typeof sys_id != 'undefined' ? sys_id : this.getParameter('sysparm_sys_id').toString();
			var result = '';
			var gr = new GlideRecord('cmdb_ci_service');
			gr.addQuery('sys_id', sys_id);
			gr.query();
			
			while (gr.next()) {
				result = gr.location;
			}
			
			return result;
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: calculateImpact
	
	The impact is set to the following default value according to the environment:
	Environment Impact
	PROD    High
	ALL OTHERS (MTEST, OTHER)   Medium
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-05
	
	Parameters:
	u_environment - sys_id of environment (String)
	
	Returns:
	Impact (Integer).
	
	Called from:
	- wsp_CS_onChangeEnvironment
 	*/
	calculateImpact : function(u_environment) {
		u_environment = typeof u_environment != 'undefined' ? u_environment : this.getParameter('sysparm_u_environment').toString();
		var aEnvironments = u_environment.toString().split(',');
		var oEnvironments = this.getEnvironments();
		
		for (var i = 0; i < aEnvironments.length; i++) {
			if (aEnvironments[i] == oEnvironments.production) {
				return 1;
			} else {
				return 2;
			}
		}
		return 3;
	},
	
	/*
	Function: calculateUrgency
	
	deprecated till workshop 10.02.2014 - 12.02.2014. Values mapped directly from
	"how many customers are affected" (Portal)
	
	Urgency calculation:
	Environment Affected customer   =   Urgency
	PROD    Yes =   1
	PROD    No  =   2
	MTEST   Yes =   2
	MTEST   No  =   3
	OTHER   Yes =   3
	OTHER   Yes =   3
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-05
	
	Parameters:
	u_environment - sys_id of environment (String)
	u_is_customer_affected - Flag if customer is affected or not (String)
	
	Returns:
	Urgency (Integer).
	
 	*/
	calculateUrgency : function(u_environment, u_is_customer_affected) {
		u_environment = typeof u_environment != 'undefined' ? u_environment : this.getParameter('sysparm_u_environment').toString();
		u_is_customer_affected = typeof u_is_customer_affected != 'undefined' ? u_is_customer_affected : this.getParameter('sysparm_u_is_customer_affected').toString();
		
		var aEnvironments = u_environment.split(',');
		var isCustomerAffected = u_is_customer_affected;
		var oEnvironments = this.getEnvironments();
		
		for (var i = 0; i < aEnvironments.length; i++) {
			if (aEnvironments[i] == oEnvironments["Production"]) {
				if (isCustomerAffected == "true") {
					return 1;
				} else {
					return 2;
				}
			} else if (aEnvironments[i] == oEnvironments["Mtest"]) {
				if (isCustomerAffected == "true") {
					return 2;
				} else {
					return 3;
				}
			} else if (aEnvironments[i] == oEnvironments["Other"]) {
				if (isCustomerAffected == "true") {
					return 3;
				} else {
					return 3;
				}
			} else if (aEnvironments[i] == oEnvironments["Corporate IT"]) {
				if (isCustomerAffected == "true") {
					return 3;
				} else {
					return 3;
				}
			}
		}
		return 0;
	},
	/*
	Function: getSupportGroup
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-01-13
	
	Parameters:
	sysparm_sys_id – sys_id of cmdb_ci record (String)
	sysparm_sys_class_name - class name of cmdb_ci record (String)
	
	Returns:
	Sys ID of support group, otherwise empty string
	
 	*/
	getSupportGroup : function(sysparm_sys_id, sysparm_sys_class_name) {
		sysparm_sys_id = typeof sysparm_sys_id != 'undefined' ? sysparm_sys_id : this.getParameter('sysparm_sys_id').toString();
		sysparm_sys_class_name = typeof sysparm_sys_class_name != 'undefined' ? sysparm_sys_class_name : this.getParameter('sysparm_sys_class_name').toString();
		try {
			var gr = new GlideRecord('cmdb_ci');
			gr.addQuery('sys_id', sysparm_sys_id);
			gr.addQuery('sys_class_name', sysparm_sys_class_name);
			gr.query();
			
			if (gr.next()) {
				return gr.support_group.toString();
			} else {
				return "";
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: isMemberOfSupportGroup
	Returns that the current user is member of the Change Support Group or not
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-21
	
	Parameters:
	Nothing.
	
	Returns:
	true - if current user is in Group
	false - else
	
 	*/
	isMemberOfSupportGroup : function(user_id) {
		if(!user_id){
			user_id = gs.getUserID();
		}
		try {
			var grMember = new GlideRecord('sys_user_grmember');
			grMember.addQuery('user', user_id);
			grMember.addQuery('group', current.assignment_group);
			grMember.query();
			
			if (grMember.next()) {
				return true;
			} else {
				return false;
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			return false;
		}
		return false;
	},
	/*
	Function: validateChangeType
	calculates change type by u_workflow_trigger_condition Table
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-21
	
	Parameters:
	Nothing.
	
	Returns:
	Change Type
	
 	*/
	validateChangeType: function(category, subcategory, environment, location) {
		category = typeof category != 'undefined' ? category : this.getParameter('sysparm_category').toString();
		subcategory = typeof subcategory != 'undefined' ? subcategory : this.getParameter('sysparm_subcategory').toString();
		environment = typeof environment != 'undefined' ? environment : this.getParameter('sysparm_environment').toString();
		location = typeof location != 'undefined' ? location : this.getParameter('sysparm_location').toString();
		
		try {
			var grTrigger = new GlideRecord('u_workflow_trigger_condition');
			grTrigger.addQuery('u_category', category);
			grTrigger.addNullQuery('u_subcategory')
			.addOrCondition('u_subcategory', subcategory);
			grTrigger.addNullQuery('u_environment')
			.addOrCondition('u_environment', environment);
			grTrigger.addNullQuery('u_location')
			.addOrCondition('u_location', location);
			grTrigger.orderBy('u_order');
			grTrigger.query();
			if (grTrigger.next()) {
				return grTrigger.u_change_type + "";
			} else {
				return '';
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			return '';
		}
		return '';
	},
	/*
	Function: isMemberOfImplementationGroup
	Returns that the current user is member of the Change Support Group or not
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-21
	
	Parameters:
	Nothing.
	
	Returns:
	true - if current user is in Group
	false - else
	
 	*/
	isMemberOfImplementationGroup: function(user_id) {
		if(!user_id){
			user_id = gs.getUserID();
		}
		try {
			var grChangeTask = new GlideRecord('change_task');
			grChangeTask.addQuery('change_request', current.sys_id);
			grChangeTask.query();
			while(grChangeTask.next()){
				
				var grMember = new GlideRecord('sys_user_grmember');
				grMember.addQuery('user', user_id);
				grMember.addQuery('group', grChangeTask.assignment_group + '');
				grMember.query();
				
				if (grMember.next()) {
					return true;
				}
			}
			
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			return false;
		}
		return false;
	},
	/*
	Function: isMemberOfImplementationGroupFromTask
	Returns that the current user is member of the Implementation Group or not
	ATTENTION: current must be a Change Task
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-21
	
	Parameters:
	Nothing.
	
	Returns:
	true - if current user is in Group
	false - else
	
 	*/
	isMemberOfImplementationGroupFromTask: function(user_id) {
		if(!user_id){
			user_id = gs.getUserID();
		}
		try {
			var grMember = new GlideRecord('sys_user_grmember');
			grMember.addQuery('user', user_id);
			grMember.addQuery('group', current.assignment_group + '');
			grMember.query();
			
			if (grMember.next()) {
				return true;
			}
			
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			return false;
		}
		return false;
	},
	/*
	Function: isMemberOfImplementationGroup
	Returns that the current user is member of the Change Support Group or not
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-21
	
	Parameters:
	Nothing.
	
	Returns:
	true - if current user is in Group
	false - else
	
 	*/
	isImplementerOfTask: function(user_id, change_id, task_id) {
		if(!user_id){
			user_id = gs.getUserID();
		}
		if(!change_id){
			change_id = current.sys_id;
		}
		try {
			var grChangeTask = new GlideRecord('change_task');
			grChangeTask.addQuery('change_request', change_id);
			if(typeof task_id != undefined && task_id != ""){
				grChangeTask.addQuery('sys_id', task_id);
			}
			
			grChangeTask.query();
			while(grChangeTask.next()){
				if(grChangeTask.assigned_to == user_id){
					return true;
				}
			}
			
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			return false;
		}
		return false;
	},
	/*
	Function: isMemberOfImplOrSupportGroup
	Returns that the current user is member of Change Support Group or the Implementer
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-21
	
	Parameters:
	Nothing.
	
	Returns:
	true - if current user is in one Group
	false - else
	
 	*/
	isMemberOfImplOrSupportGroup : function(user_id) {
		if(!user_id){
			user_id = gs.getUserID();
		}
		try {
			var inImplementationGroup = this.isMemberOfImplementationGroup(user_id);
			if(inImplementationGroup){
				return true;
			}
			
			var inSupportGroup = this.isMemberOfSupportGroup(user_id);
			if(inSupportGroup){
				return true;
			}
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			return false;
		}
		return false;
	},
	
	/*
	Function: getRolesFromGroup
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-02-28
	
	Parameters:
	sys_id – sys id of group (type)
	
	Returns:
	Nothing.
	
	See Also:
	
	Called from:
	- incidentUtils_getRolesFromGroup
 	*/
	getRolesFromGroup : function(sys_id) {
		sys_id = typeof sys_id != 'undefined' ? sys_id : this.getParameter('sysparm_sys_id').toString();
		
		try {
			var aResult = [];
			var gr = new GlideRecord('sys_group_has_role');
			gr.addQuery('group', sys_id);
			gr.query();
			
			while (gr.next()) {
				aResult.push(gr.role.name);
			}
			return aResult.join(',');
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getPriorityFromLookUpMatrix
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-03-12
	
	Parameters:
	impact – impact of incident (integer)
	urgency - urgency of incident (integer)
	u_business_criticality - business criticality of service (string)
	
	Returns:
	priority from Datalookup Table.
	
	See Also:
 	*/
	getPriorityFromLookUpMatrix : function(impact, urgency, u_business_criticality) {
		var gr = new GlideRecord('dl_u_priority');
		gr.addQuery('impact', impact);
		gr.addQuery('urgency', urgency);
		gr.addQuery('u_business_criticality', u_business_criticality);
		gr.addQuery('active', true);
		gr.orderByDesc('order');
		gr.query();
		
		if (gr.next()) {
			return gr.priority;
		} else {
			return 4;
		}
	},
	/*
	Function: getRefQualImpactedBusinessService
	
 	*Author:*
	Jürgen Fehse (juergen.fehse@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-03-12
	
	Parameters:
	current – current GlideRecord (GlideRecord)
	
	Returns:
	Nothing.
	
	See Also:
 	*/
	getRefQualImpactedBusinessService : function(current) {
		try {
			var result = '';
			result += 'u_available_in_impacted_busine=true^u_environmentIN' + current.u_environment;
			/**
			// Remove _security if type is security
			if (current.u_incident_type == 'security') {
				result += '^u_category=' + current.category.toString().replace(/\_security/, '');
			} else {
				result += '^u_category=' + current.category;
			}
 			*/
			return result;
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getRefQualAffectedCI
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-25
	
	Parameters:
	dependent_id – sys_id of dependent ci (string)
	
	Returns:
	query string.
	
	See Also:
 	*/
	getRefQualAffectedCI : function(dependent_id) {
		try {
			var query = 'sys_class_name!=cmdb_ci_service^sys_class_name!=cmdb_ci_environment^sys_class_name!=cmdb_ci_provider^sys_class_name!=cmdb_ci_customer^u_available_in_affected_cis=true';
			
			var ci_ids = [];
			var child_ids = this.getAllChildCIs(dependent_id, 0, true);
			if(child_ids != ""){
				query = 'sys_idIN' + child_ids;
			}
			
			return query;
		} catch(ex) {
			gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
		}
	},
	/*
	Function: getAllChildCIs
	get all child (and child of child) CIs of all parents
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-25
	
	Parameters:
	parent_ids – comma seperated list of cmdb_ci (string)
	depth - depth of recursion (integer)
	available_in_affected - return only ci ids where awailable in affected is true (boolean)
	
	Returns:
	comma seperated list of cmdb_ci ids.
	
	See Also:
 	*/
	getAllChildCIs: function(parent_ids, depth, available_in_affected){
		var children = [];
		var max_depth = 9;
		if(typeof depth == undefined){
			depth = 0;
		}
		if(!parent_ids){
			return '';
		}
		if(max_depth <= depth){
			return '';
		}
		var grChildren = new GlideRecord('cmdb_rel_ci');
		grChildren.addQuery('parent', 'IN', parent_ids);
		//grChildren.addQuery('type.name', 'Depends on::Used by');
		if(available_in_affected){
			grChildren.addQuery('child.u_available_in_affected_cis', true);
		}
		grChildren.query();
		while(grChildren.next()){
			children.push(grChildren.child + '');
		}
		while(depth < max_depth){
			var chgutil = new wsp_SI_ChangeUtils();
			var child_of_children = chgutil.getChildCIs(children.join(','), depth);
			if(child_of_children == ""){
				break;
			}
			child_of_children = child_of_children.split(',');
			for(var index = 0; index < child_of_children.length ;index++){
				children.push(child_of_children[index]);
			}
			depth++;
		}
		//Allow users to choose none (application)
		children.push('13b7da040fa616004c57c873e2050e9a');
		//Allow users to choose none (CI)
		children.push('947699486f082500685246916e3ee401');
		//Allow users to choose not listed (CI)
		children.push('b4ab680f6fdc56005eb2c145eb3ee416');
		return children.join(',');
	},
	/*
	Function: getChildCIs
	get all child CIs of all parents
	
 	*Author:*
	Marcel Clemens (marcel.clemens@wsp-consulting.de)
	
 	*Company:*
	WSP-Consulting GmbH
	
 	*Date created:*
	2014-07-25
	
	Parameters:
	parent_ids – comma seperated list of cmdb_ci (string)
	depth - depth of recursion (integer)
	available_in_affected - return only ci ids where awailable in affected is true (boolean)
	
	Returns:
	comma seperated list of cmdb_ci ids.
	
	See Also:
 	*/
	getChildCIs: function(parent_ids, depth){
		var children = [];
		var max_depth = 9;
		if(typeof depth == undefined){
			depth = 0;
		}
		if(!parent_ids){
			return '';
		}
		if(max_depth <= depth){
			return '';
		}
		var grChildren = new GlideRecord('cmdb_rel_ci');
		grChildren.addQuery('parent', 'IN', parent_ids);
		//grChildren.addQuery('type.name', 'Depends on::Used by');
		//if(available_in_affected){
			grChildren.addQuery('child.u_available_in_affected_cis', true);
			//}
			grChildren.query();
			while(grChildren.next()){
				children.push(grChildren.child + '');
			}
			return children.join(',');
		},
		
		/*
		Function: getAllChildCIsAjax
		get all child (and child of child) CIs of all parents (for Clients)
		
 		*Author:*
		Marcel Clemens (marcel.clemens@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-07-25
		
		Parameters:
		sysparm_parent_ids – comma seperated list of cmdb_ci (string)
		sysparm_depth - depth of recursion (integer)
		sysparm_awailable_in_affected - return only ci ids where awailable in affected is true (boolean)
		
		Returns:
		comma seperated list of cmdb_ci ids.
		
		See Also:
 		*/
		getAllChildCIsAjax: function(){
			try{
				var parent_id = this.getParameter('sysparm_parent_id').toString();
				var depth = this.getParameter('sysparm_depth').toString();
				var available_in_affected = this.getParameter('sysparm_available_in_affected').toString();
				if(!parent_id){
					return '';
				}
				if(isNaN(depth) || depth == ''){
					depth = 0;
				}
				//change from string to boolean
				available_in_affected = available_in_affected == 'true';
				
				return this.getAllChildCIs(parent_id, parseInt(depth), available_in_affected);
			} catch(ex) {
				gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			}
			return '';
		},
		
		/*
		Function: getRefQualAffectedCustomer
		
 		*Author:*
		Jürgen Fehse (juergen.fehse@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-03-12
		
		Parameters:
		businessService – sys id of business service (String)
		
		Returns:
		Nothing.
		
		See Also:
 		*/
		getRefQualAffectedCustomer : function(businessService) {
			try {
				businessService = typeof businessService != 'undefined' ? businessService : this.getParameter('sysparm_businessService').toString();
				var queryString = '';
				queryString += 'type=55c913d3c0a8010e012d1563182d6050';
				queryString += '^parent.sys_class_name=u_cmdb_ci_customer';
				queryString += '^child=' + businessService;
				
				var aResult = [];
				var gr = new GlideRecord('cmdb_rel_ci');
				gr.addEncodedQuery(queryString);
				gr.query();
				while (gr.next()) {
					aResult.push(gr.parent.toString());
				}
				return aResult.join(',');
			} catch(ex) {
				gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			}
		},
		
		/*
		Function: getRefQualEnvironment
		Reference Qualifier for environment
		
 		*Author:*
		Marcel Clemens (marcel.clemens@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-07-14
		
		Parameters:
		requested_by – sys id of requested_by (String)
		
		Returns:
		Query String for Reference Qualifier.
		
		See Also:
 		*/
		getRefQualEnvironment : function(requested_by) {
			try {
				requested_by = typeof requested_by != 'undefined' ? requested_by : this.getParameter('sysparm_requested_by').toString();
				
				if(requested_by == ""){
					return ''; //allow all if there is no requested_by
				}
				
				var aResult = [];
				
				var grRequested_by = new GlideRecord('sys_user');
				if(grRequested_by.get(requested_by)){
					
					var grEnvi = new GlideRecord('cmdb_ci_environment');
					
					if(grRequested_by.company != ""){
						grEnvi.addNullQuery('u_visible_to')
						.addOrCondition('u_visible_to', 'CONTAINS', grRequested_by.company);
					}
					grEnvi.query();
					while(grEnvi.next()){
						aResult.push(grEnvi.sys_id + "");
					}
					
				}
				
				return 'sys_idIN' + aResult.join(',');
			} catch(ex) {
				gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			}
		},
		/*
		Function: __getInfoGroupMembers
		
 		*Author:*
		Jürgen Fehse (juergen.fehse@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-01-29
		
		Parameters:
		grpSysId – sys id of group (type)
		
		Returns:
		group member sys_id list.
		
		See Also:
 		*/
		__getInfoGroupMembers : function(grpSysId) {
			var aResult = [];
			try {
				var grGrpMembers = new GlideRecord('sys_user_grmember');
				grGrpMembers.addQuery('group', grpSysId);
				grGrpMembers.query();
				
				while (grGrpMembers.next()) {
					if (grGrpMembers.user.toString() != "") {
						aResult.push(grGrpMembers.user.toString());
					}
				}
			} catch(ex) {
				gs.log("wsp_SI_ChangeUtils: " + JSUtil.describeObject(ex));
			}
			
			return aResult.join(',');
		},
		/*
		Function: getNextPendingChangeTask
		Finds next pending Change Task
		
 		*Author:*
		Marcel Clemens (marcel.clemens@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-07-29
		
		Parameters:
		request_id – sys id of change_request in Change Task (String)
		cTask_id - sys_id of change_task that should be filtered out (String)
		
		Returns:
		Glide Record of the next pending Change Task or ''
		
		See Also:
 		*/
		getNextPendingChangeTask: function(request_id, cTask_id){
			var grChangeTask = new GlideRecord('change_task');
			if(cTask_id){
				grChangeTask.addQuery('sys_id', '!=', cTask_id);
			}
			grChangeTask.addQuery('change_request', request_id);
			grChangeTask.addQuery('state', -5);
			grChangeTask.orderBy('order');
			grChangeTask.query();
			if(grChangeTask.next()){
				return grChangeTask; //get first pending task
			}
			return null;
		},
		/*
		Function: canPerformRollback
		validates that the current Record has only Production in the environment field
		
 		*Author:*
		Marcel Clemens (marcel.clemens@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-07-31
		
		Parameters:
		change_task – Task record (GlideRecord)
		
		Returns:
		false - if there was no Production only environment
		
		See Also:
 		*/
		canPerformRollback: function(change_task){
			var firstRow = true;
			var grChangeTask = new GlideRecord('change_task');
			grChangeTask.addQuery('change_request', change_task.change_request);
			grChangeTask.addQuery('order', '<=', change_task.order);
			grChangeTask.orderBy('order');
			grChangeTask.query();
			while(grChangeTask.next()){
				if((grChangeTask.u_environment.getDisplayValue() + "") == 'Production'){
					return false;
				}
				if(firstRow && change_task.sys_id + "" == grChangeTask.sys_id + ""){
					return -1;
				}
				firstRow = false;
			}
			return true;
		},
		/*
		Function: getNextFreeChangeTaskOrder
		Calculates the next open Order for the Change Tasks
		
 		*Author:*
		Marcel Clemens (marcel.clemens@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-07-29
		
		Parameters:
		request_id – sys id of change_request in Change Task (String)
		
		Returns:
		Next free order of the Change Tasks
		
		See Also:
 		*/
		getNextFreeChangeTaskOrder: function(request_id){
			var order = 10;
			if(!request_id){
				return order;
			}
			var grChangeTask = new GlideRecord('change_task');
			grChangeTask.addQuery('change_request', request_id);
			grChangeTask.addNotNullQuery('order');
			grChangeTask.orderByDesc('order');
			grChangeTask.query();
			if(grChangeTask.next()){
				order = order + parseInt(grChangeTask.order); //add 10 to max order
			}
			return order;
		},
		
		/*
		Function: getDependingChoicesAjax
		client side callable function for getDependingChoices
		
 		*Author:*
		Marc Weidmann (marc.weidmann@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-12-19
		
		Parameters:
		demendent_value: dependent field as string
		element: element of choices
		table: if undefined its incident
		
		Returns:
		Nothing.
		
		See Also:
 		*/
		getDependingChoicesAjax: function(){
			var dependent_value = this.getParameter('sysparm_cdependent_value') + "";
			var element = this.getParameter('sysparm_celement') + "";
			var table = this.getParameter('sysparm_ctable') + "";
			
			return this.getDependingChoices(dependent_value, element, table);
			
		},
		
		/*
		Function: getDependingChoices
		Returns ';;;;' seperated list of Label::::Value pairs
		
 		*Author:*
		Marc Weidmann (marc.weidmann@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-12-19
		
		Parameters:
		demendent_value: dependent field as string
		element: element of choices
		table: if undefined its incident
		
		Returns:
		Nothing.
		
		See Also:
 		*/
		getDependingChoices: function(dependent_value, element, table){
			if(!dependent_value){
				return "";
			}
			if(!element){
				return "";
			}
			if(!table){
				table = 'change_request';
			}
			var choice_list = [];
			
			var choices = new GlideRecord('sys_choice');
			choices.addQuery('inactive', false);
			choices.addQuery('name', table);
			choices.addQuery('element', element);
			choices.addQuery('dependent_value', dependent_value);
			choices.query();
			while(choices.next()){
				choice_list.push(choices.label + "::::" + choices.value);
			}
			gs.log('choice_list: ' + choice_list.join(';;;;'));
			return choice_list.join(';;;;') + "";
			
		},
		
		/*
		Function: GetAssignmentGroups
		Returns groups which begin with SKR ITIO and PSC ITIO
		
 		*Author:*
		Marc Weidmann (marc.weidmann@wsp-consulting.de)
		
 		*Company:*
		WSP-Consulting GmbH
		
 		*Date created:*
		2014-12-23
		
		Parameters:
		Nothing
		
		Returns:
		Groups
		
		See Also:
 		*/
		
		GetAssignmentGroups: function(){
			var querystring = "nameSTARTSWITHSKR ITIO^ORnameSTARTSWITHPSC ITIO";
			var groups = [];
			
			var gr = new GlideRecord('sys_user_group');
			gr.addEncodedQuery(querystring);
			gr.query();
			
			while(gr.next()){
				groups.push(gr.sys_id + "");
			}
			
			//gs.log('groups: ' + groups.join(','), "MW");
			return 'sys_idIN' + groups.join(',');
			
		},
		/*
		Function: AllTasksClosed
		Checks whether all change tasks are closed
		
 		*Author:*
		Andrey Dautev
		
 		*Company:*
		ITCE Ltd
		Parameters:
		changeId - the id of the change
		
		Returns:
		True in case all tasks are closed
		
		See Also:
 		*/
		
		AllTasksClosed: function(changeId){
			var tasks = new GlideRecord('change_task');
			tasks.addQuery('state','NOT IN', '3,4,7,6,11');
			tasks.addQuery('change_request',changeId);
			tasks.query();
			if(tasks.next()) {
				return false;
			}
			return true;
		},
		type : 'wsp_SI_ChangeUtils'
	});
	
	
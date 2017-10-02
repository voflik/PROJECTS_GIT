//Alert if the assignment groups name matches the support group
function onChange(control, oldValue, newValue, isLoading) {
 
    if (isLoading)
        return;

    var ga = new GlideAjax('ciCheck');

    ga.addParam('sysparm_name', 'getCiSupportGroup');
    ga.addParam('sysparm_ci', g_form.getValue('cmdb_ci'));
    ga.addParam('sysparm_ag', g_form.getValue('assignment_group'));
    ga.getXML(doAlert); // Always try to use asynchronous (getXML) calls rather than synchronous (getXMLWait)
}

// Callback function to process the response returned from the server
function doAlert(response) {

    var answer = response.responseXML.documentElement.getAttribute("answer");

    alert(answer);
}
This script relies on an accompanying script include, such as:

var ciCheck = Class.create();

ciCheck.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    
    getCiSupportGroup: function() {
        
        var retVal = ''; // Return value
        var ciID   = this.getParameter('sysparm_ci');
        var agID   = this.getParameter('sysparm_ag');		
        var ciRec  = new GlideRecord('cmdb_ci');
        
        // If we can read the record, check if the sys_ids match
        if (ciRec.get(ciID)) {
            if (ciRec.getValue('support_group') == agID)
                retVal = 'CI support group and assignment group match';
            else
                retVal = 'CI support group and assignment group do not match';
            
            // Can't read the CI, then they don't match
        } else {
            retVal = 'CI support group and assignment group do not match';
        }
        
        return retVal;
    }
    
});
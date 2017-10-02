//SESSIONS
// set theme on login
setUserTheme();

function setUserTheme() {
   setTheme('');

   var pref = gs.getUser().getPreference('glide.css.theme');
   if (pref) {
      setTheme(pref);
   }

   var company = gs.getUser().getCompanyRecord();
   if (!company)
      return;

   var theme = company.getValue('theme');
   if (theme)
      setTheme(theme);
}

function setTheme(theme) {
  gs.getSession().putProperty('glide.css.theme', theme);
}


// clear unsuccessfuk login attempts
//
// login was successful so reset the failed attempts count
//
gs.log(event.parm1);
var gr = new GlideRecord("sys_user");
gr.addQuery("user_name", event.parm1.toString());
gr.query();
if (gr.next()) {
    gr.failed_attempts = 0;
    gr.last_login = gs.now();
    gr.update();
}

// Megaphone ??

SNC.MegaphoneBroadcast.addMegaphoneMessagesToSessionsForUserOnAllNodes(event.parm1);

//Insert from event param1 sysevent_script_action.event_name

function insertMegaphoneMessage() {
	if(event.parm1.nil()) {
		gs.warn("Empty megaphone broadcast message inserted");
	}
	else {
		var mega = new MegaphoneBroadcastInsert();
		mega.fromEvent(event.parm1);
	}
}

insertMegaphoneMessage();

//
// Set the Last login time field on the user record, DO NOT update sys_updated_on, sys_updated_by, or sys_mod_count
//
var gr = new GlideRecord("sys_user");
gr.addQuery("user_name", event.parm1);
gr.query();
if (gr.next()) {
	gr.last_login_time = event.sys_created_on;
	gr.last_login_device = event.parm2;
	gr.autoSysFields(false);
	gr.update();
}


// Log + monitor + impersonate  sysevent_script_action.event_name

var client = new WSClientAdaptor("http://hi.service-now.com/incident.do?WSDL");
var myname = gs.getProperty("glide.installation.name");
client.impersonate(myname);
client.setMethodName("insert");
var sd = "Logfile match found for file: " + event.parm1
client.setParameter("short_description", event.parm2);
client.setParameter("comments", sd + "\n" + event.parm2);
client.setParameter("category", "Monitor");
var sysid = client.invokeFiltered("//sys_id");
gs.print("LogFileMonitor created incident: " + sysid);

/*
 * We could create logic around what to do if this request is
 * a GET, PUT, POST, or DELETE request.  To get that HTTP Method,
 * we use the getMethod() function on the request.
 * In this example, we just log it to a string variable
 */
var methodMsg = "Method string: "+g_request.getMethod()+"\n";

/*
 * We could iterate through all of the headers to make
 * intelligent decisions about how to handle this request,
 * but in this example, we will just write each header
 * and its value to a logging string
 */
var headerList = g_request.getHeaderNames();
var headerMsg = ""; //we're going to log header info here
while(headerList.hasMoreElements()){
    var header = headerList.nextElement();
    var value = g_request.getHeader(header);
    headerMsg += ("Header: ["+header+"] has a value of: "+value+"\n");
}

/*
 * We could iterate through all of the URL parameters to make
 * intelligent decisions about how to handle this request,
 * but in this example, we will just write each URL parameter
 * and its value to a logging string
 */
var urlParamList = g_request.getParameterNames();
var paramMsg = ""; //we're going to log parameter info here
while(urlParamList.hasMoreElements()){
    var param = urlParamList.nextElement();
    var value = g_request.getParameter(param);
    paramMsg += ("Parameter: ["+param+"] has a value of: "+value+"\n");
}

/*
 * Grab the input stream from the request and store the stream contents
 * into a variable, "sb" in this case, so that we can read it easily
 */
var inputStream = g_request.getInputStream();
var is = g_request.getInputStream();
var sb = GlideStringUtil.getStringFromStream(is);

var contentType = g_request.getHeader("Content-Type");
if( contentType == "application/xml" ){
    /*
     * The body is supposed to be in XML format, convert it to an object
     * using ServiceNow XML libraries
     */
    var helper = new XMLHelper(""+sb);
    var person = helper.toObject();
} else {
    /*
     * The body is not XML, so we are going to assume it is in JSON format.
     * Use ServiceNow libraries to covert the JSON string to an object
     */
    var parser = new JSONParser();
    var person = parser.parse(sb);
}


/*
 * Now we would normally process the request given the data posted to
 * us.  However, for this example, we are going to simply build out
 * a text response that is tailored to the information given to us
 */
var returnMessage = "";
returnMessage += "We received a Request from you with the following information:\n";
returnMessage += methodMsg;
returnMessage += "\nWITH INCOMING HEADERS\n";
returnMessage += headerMsg;
returnMessage += "\nWITH URL PARAMETERS OF\n";
returnMessage += paramMsg;
returnMessage += "\n\n";
returnMessage += "We will process the following vehicles for ";
returnMessage += person.first + " " + person.last + ":\n";
if( person.cars.car ){
  //XML case
    var listOfCars = person.cars.car;
} else {
  //JSON case
    var listOfCars = person.cars;
}
for(key in listOfCars){
    returnMessage += listOfCars[key].year + "-";
    returnMessage += listOfCars[key].make + "-";
    returnMessage += listOfCars[key].model + "\n";
}

/*
 * We can set headers in our response to the client.  In this case, we will
 * send a "Content-Type" header to tell the client
 * that our response is just plain text.  Normally we would respond
 * in JSON or XML format.  But, we will keep it simple.
 */
g_response.setHeader("Content-Type", "text/plain");

/*
 * If we want to send information back to the client, we can
 * do so through the writeOutput function on the processor
 */
g_processor.writeOutput(returnMessage);



///////////////////////
/*
*
*
* Processor OOB
*/
var EMAIL_VERSION_HEADER_NAME = "X-ServiceNow-SysEmail-Version:";
var TEXT_HTML = "text/html; charset=utf-8";
var STYLE = "<style> body {"+ gs.getProperty("glide.ui.activity.style.email") + "}</style>";
var TOP_HTML = '<base target="_blank"/>' + STYLE;


var SecurityUtil = new GlideSecurityUtils();
process();

function process() {
  var email_id = g_request.getParameter("email_id");
  var emailRecord = new GlideRecord("sys_email");
  if (emailRecord.get(email_id)) {
    showEmail(emailRecord);
  } else
    g_processor.writeOutput("No such email");
}

function showEmail(emailRecord) {
  if (getParentRecord(emailRecord)) {
    if (getEmailVersion(emailRecord) == 2)
      writeBody(emailRecord);
    else
      writeBodyLegacy(emailRecord);
  }
}

function writeBody(emailRecord) {
	if (!JSUtil.nil(emailRecord.body)) {
		var sanitizedBody = sanitizeEmail(emailRecord);
		g_processor.writeOutput(TEXT_HTML,TOP_HTML + SecurityUtil.escapeScript(sanitizedBody));
	}

  else if (!JSUtil.nil(emailRecord.body_text))
    g_processor.writeOutput("text/plain", emailRecord.body_text);
}

function writeBodyLegacy(emailRecord) {
   var content_type = emailRecord.content_type.replace(/(\r+)(\n+)|(\n+)(\r+)|(\n+)|(\r+)/g, " ");
    if (content_type.startsWith("multipart")) {
      var unfoldedHeader = emailRecord.headers.replace(/\r\n\s/g, "");
      var multipleContentTypes = unfoldedHeader.match(/MultipartContentTypes.*/i);
      if (multipleContentTypes && multipleContentTypes.toString().toUpperCase().indexOf("TEXT/HTML") == -1)
        content_type = "text/plain";
	  else {
        content_type = TEXT_HTML;
		}
    }
	var sanitizedBody = sanitizeEmail(emailRecord);
	var body = SecurityUtil.escapeScript(sanitizedBody);
	if(content_type == TEXT_HTML)
		body = TOP_HTML + body;

    g_processor.writeOutput(content_type, body);
}

function getParentRecord(emailRecord) {
  var table = emailRecord.target_table;
  if (table) {
    var emailParentRecord = new GlideRecord(table);
    if (emailParentRecord.get(emailRecord.instance)){
      if (emailParentRecord.canRead())
        return emailParentRecord;
      else
        g_processor.writeOutput("No access");
    } else
      g_processor.writeOutput("No such parent record");
  } else {
    var sanitizedBody = sanitizeEmail(emailRecord);
    g_processor.writeOutput(TEXT_HTML, SecurityUtil.escapeScript(sanitizedBody));

  }

}

function getEmailVersion(emailRecord) {
  var emailVersionHeaderLine = emailRecord.headers.match(/X-ServiceNow-SysEmail-Version.*/i) + "";
  if (JSUtil.nil(emailVersionHeaderLine))
    return 1;

  var version = emailVersionHeaderLine.substring(EMAIL_VERSION_HEADER_NAME.length).trim();
  return version.valueOf();
}

function sanitizeEmail(emailRecord) {
	return SNC.GlideHTMLSanitizer.sanitize(emailRecord.body);
}

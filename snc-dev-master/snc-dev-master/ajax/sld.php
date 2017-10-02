<!DOCTYPE html>
<html>
<head>

<script type="text/javascript" src="jquery-1.5.2.min.js"></script>
<script type="text/javascript"> 
$(document).ready(function(){
$(".flip").click(function(){
    $(".panel").slideToggle("slow");
  });
});
</script>
 
<style type="text/css"> 
div.panel,p.flip
{
margin:0px;
padding:5px;
text-align:center;
background:#e5eecc;
border:solid 1px #c3c3c3;
}
div.panel
{
height:120px;
display:none;
}
</style>
</head>
 
<body>
 
<div class="panel">
<ul>
<li> sect 1</li>
<li>or two</li>
<li>3 maybe</li>


</ul>
<p>Because time is valuable, we deliver quick and easy learning.</p>
<p>At W3Schools, you can study everything you need to learn, in an accessible and handy format.</p>
</div>
 
<p class="flip">Show/Hide Panel</p>
 
</body>
</html>


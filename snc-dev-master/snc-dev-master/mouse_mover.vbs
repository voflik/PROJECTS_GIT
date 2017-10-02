''set oShell = CreateObject("WScript.Shell")
''Set oAutoIt = CreateObject("AutoItX.Control")
''oShell.run"c:\windows",3
''WScript.Sleep 500
''oAutoIt.MouseMove 10, 10
''WScript.Sleep 500
''oShell.SendKeys"c"
''oShell.SendKeys"{enter}"

Dim Shell : Set Shell = CreateObject("WScript.Shell") 
Shell.Run"RunDll32.exe user32.dll,SetCursorPos 400,400" 

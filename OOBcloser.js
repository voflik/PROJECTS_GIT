function closeRelatedTasks(me) {
    var task = new GlideRecord("task");
    task.addQuery("parent", me.sys_id);
    task.addQuery("sys_class_name", "!=", "kb_submission");
    task.addQuery("sys_class_name", "!=", "incident");
    task.query();
    while (task.next()) {
        if (task.sys_class_name == "problem") {
            closeProblem(task.sys_id, me.number);
        } else {
            if (task.sys_class_name == "change_request") {
                closeChange(task.sys_id, me.number);
            } else {
                task.active.setValue(false);
                task.update();
                gs.print("Task " + task.number + " closed based on closure of task " + me.number);
            }
        }
    }
    this.closeIncident(me);
}

// data layer

// data layer object
var TasksData = function () {
    this.store = []; // empty data store, could easily write to an ORM layer
    this.id = 0; // currently available unique ID
}

// add a new task to the data store
TasksData.prototype.add_task = function () {
    var base = this;
    var now = new Date();
    var id = base.id;
    var task = {
        id: id,
        time_created: now,
        time_updated: null,
        time_completed: null,
        time_deleted: null,
        description: null,
        tags: null
    }
    base.store[id] = task;
    base['id'] = id + 1;
    return id;
}

TasksData.prototype.update_task = function (id, content) {
    var base = this;
    base.store[id]['time_updated'] = new Date();
    base.store[id]['tags'] = content['tags'];
    base.store[id]['description'] = content['description'];
}

TasksData.prototype.complete_task = function (id) {
    var base = this;
    base.store[id]['time_completed'] = new Date();
}

TasksData.prototype.delete_task = function (id) {
    var base = this;
    base.store[id]['time_deleted'] = new Date();
}

TasksData.prototype.get_active_tasks = function (query) {
    var base = this;
    var result = base.store.filter(function (value) {
        if (
            value['time_deleted'] == null &&
            value['time_completed'] == null
        ) {
            return true;
        } else {
            return false;
        }
    });
    if (typeof query != 'undefined') {
        result = base.get_query_tasks(result, query);
    }
    result.sort(function (a, b) {
        return (b['time_created'] - a['time_created']);
    });
    return result;
}

TasksData.prototype.get_completed_tasks = function (query) {
    var base = this;
    var result = base.store.filter(function (value) {
        if (
            value['time_deleted'] == null &&
            value['time_completed'] != null
        ) {
            return true;
        }
        return false;
    });
    if (typeof query != 'undefined') {
        result = base.get_query_tasks(result, query);
    }
    result.sort(function (a, b) {
        return (b['time_created'] - a['time_created']);
    });
    return result;
}

TasksData.prototype.get_query_tasks = function (subset, query) {
    var base = this;
    if (typeof query == 'undefined') { return subset; }
    // brute search over all non deleted tasks in the store for the query
    var query = query.toLowerCase();
    var result = subset.filter(function (value) {
        if (value['description'].toLowerCase().indexOf(query) != -1) { return true; }
        for (var i = 0; i < value['tags'].length; i++) {
            if (value['tags'][i].indexOf(query) != -1) { return true; }
        }
        return false;
    });
    return result;
}

var TasksUI = function (data) {
    // data layer
    this.data = data;
    // UI selectors
    this.$tasks = $('.tasks');
    this.$task_template = this.$tasks.find('.task.template');
    this.$control_add_task = $('.touchpoints .control.add');
    this.$control_search_tasks = $('.touchpoints [name=search]');
    this.$empty = $('.empty');
    this.bind_controls();
    this.search_tasks('');
}

TasksUI.prototype.add_task_node = function (task) {
    var base = this;
    var $task_node = base.$task_template.clone();
    $task_node.removeClass('template');
    $task_node.prependTo(base.$tasks);
    base.bind_task_node($task_node);
    if (typeof task == 'undefined') {
        var id = base.data.add_task();
        base.populate_task_node_id($task_node, id);
        // shift focus to the first input
        $task_node.find('[name=description]').focus();
    } else {
        base.populate_task_node($task_node, task);
    }
    base.$empty.hide();
}

TasksUI.prototype.bind_task_node = function ($task_node) {
    var base = this;
    var $task_node_tags = $task_node.find('textarea.tags');
    // initiate tags plugin
    $task_node_tags.textext({plugins: 'tags'});
    // disallow duplicate or empty tags
    $task_node_tags.bind('isTagAllowed', function (e, data) {
        var form_data = $(e.target).textext()[0].tags()._formData;
        var list = form_data;
        if (form_data.length && list.indexOf(data.tag) >= 0) {
           data.result = false;
        }
        if ($.trim(data.tag) == '') {
            data.result = false;
        }
    });
    // on enter in description, shift focus to tag input
    $task_node.find('[name=description]').on('keydown', function (ev) {
        if (ev.keyCode == 13) {
            $(this).parent().find('textarea.tags').focus();
        }
    });
    $task_node.find('.control.complete').on('click', function () {
        base.complete_task_node($task_node);
    });
    $task_node.find('.control.delete').on('click', function () {
        base.delete_task_node($task_node);
    });
    $task_node.find('textarea.tags, [name=description]').on('keyup', function () {
        base.serialize_task_node($task_node);
    });
    // TextExt limitation: no elegant, reliable way to know when the underlying hidden input has changed its value, so we have to listen to every single keystroke even though many of those don't result in an added tag
}

TasksUI.prototype.populate_task_node_id = function ($task_node, id) {
    $task_node.find('[name=id]').val(id);
}

TasksUI.prototype.populate_task_node = function ($task_node, task) {
    var base = this;
    $task_node.find('[name=id]').val(task['id']);
    $task_node.find('[name=description]').val(task['description']);
    // hacky, but adds any existing tags
    $task_node.find('textarea.tags').textext()[0].tags().addTags(task['tags']);
    if (task['time_completed'] != null) {
        base.draw_completed_task_node($task_node);
    }
}

TasksUI.prototype.bind_controls = function () {
    var base = this;
    base.$control_add_task.on('click', function () {
        base.add_task_node();
    });
    base.$control_search_tasks.on('keyup', function (ev) {
        var query = $(this).val();
        base.search_tasks(query);
    });
}

TasksUI.prototype.serialize_task_node = function ($task_node) {
    var base = this;
    var id = parseInt($task_node.find('[name=id]').val());
    var description = $task_node.find('[name=description]').val();
    var tags = JSON.parse($task_node.find('[name=tags]').val());
    base.data.update_task(
        id,
        {
            description: description,
            tags: tags
        }
    );
}

TasksUI.prototype.delete_task_node = function ($task_node) {
    var base = this;
    var id = parseInt($task_node.find('[name=id]').val());
    base.data.delete_task(id);
    $task_node.remove();
    if (base.$tasks.children().length == 1) {
        base.$empty.show();
    }
}

TasksUI.prototype.complete_task_node = function ($task_node) {
    var base = this;
    var id = parseInt($task_node.find('[name=id]').val());
    base.data.complete_task(id);
    base.draw_completed_task_node($task_node);
}

TasksUI.prototype.draw_completed_task_node = function ($task_node) {
    $task_node.addClass('complete');
    // disable all inputs
    $task_node.find('input, button, textarea').prop('disabled', true);
    $task_node.find('.conrol.delete').prop('enabled', true);
    $task_node.find('textarea.tags').attr('placeholder', '');
}

TasksUI.prototype.clear_task_nodes = function () {
    var base = this;
    base.$tasks.find('.task').each(function () {
        if (!$(this).hasClass('template')) {
            $(this).remove();
        }
    });
    base.$empty.show();
}

TasksUI.prototype.search_tasks = function (query) {
    var base = this;
    base.clear_task_nodes();
    var active_tasks = base.data.get_active_tasks(query);
    var completed_tasks = base.data.get_completed_tasks(query);
    for (var i = 0; i < completed_tasks.length; i++) {
        base.add_task_node(completed_tasks[i]);
    }
    for (var i = 0; i < active_tasks.length; i++) {
        base.add_task_node(active_tasks[i]);
    }
}

var tasks_data = new TasksData();
var tasks_ui = new TasksUI(tasks_data);
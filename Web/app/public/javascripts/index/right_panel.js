var ReceiverController = function() {
    var $receivers = $('#receivers .list-group');
    var $addReceiver = $('.add-receiver');
    var $count = $('#receiver-count span');
    var count;
    var $form = $('#receiver-form');
    
    var Backend = {
        getReceivers: function() {
            return $.ajax({
                type: 'GET',
                url: '/rooms/' + RoomController.getRoomId() + '/receivers',				
                success: function(data, status, jqXHR) {
                    var receivers = data;
                    count = receivers.length;
                    for (var i = 0; i < receivers.length; i++) {
                        var id = receivers[i].id;
                        var ip = receivers[i].address;
                        $receivers.append(makeReceiverElement(id, ip));	
                    }
                },
                error: function(jqXHR, status, err) {}
            });
        },
        getFreeReceivers: function() {
            return $.ajax({
                type: 'GET',
                url: '/receivers/free',				
                success: function(data, status, jqXHR) {
                    var freeReceivers = data;
                    if (freeReceivers.length === 0) {
                        alert('no free speakers');
                    } else {
                        populateFreeReceivers(freeReceivers);             
                        showForm();
                    }
                },
                error: function(jqXHR, status, err) {}
            });
        },    
        addReceiver: function(id, ip) {
            return $.ajax({
                type: 'POST',
                data: {
                    'receiver_id': id,
                    'room_id': RoomController.getRoomId()
                },
                url: '/configurations',		
                success: function(data, status, jqXHR) {
                    hideForm();
                    SocketIOClient.addReceiver(id, ip);
                },
                error: function(jqXHR, status, err) {}
            });
        },     
        removeReceiver: function(id) {
            return $.ajax({
                type: 'DELETE',
                data: {
                    'receiver_id': id,
                    'room_id': RoomController.getRoomId()
                },
                url: '/configurations',				
                success: function(data, status, jqXHR) {
                    SocketIOClient.removeReceiver(id);
                },
                error: function(jqXHR, status, err) {}
            });    
        }
    };       
    
    function incrementCount(n) {
        count += n;
        $count.text(count);
    }
    
    function makeReceiverElement(id, ip) {
        var $el = $('#receivers .placeholder .receiver').clone();
        $el.attr('id', id);
        $el.find('.info').text(ip);
        $el.find('.remove').click(function(e) {
            Backend.removeReceiver($el.attr('id'));
        });
        return $el;
    }
    
    function populateFreeReceivers(freeReceivers) {
        for (var i = 0; i < freeReceivers.length; i++) {
            var id = freeReceivers[i].id;
            var ip = freeReceivers[i].address;
            var $el = $form.find('.placeholder .form-check').clone();
            $el.find('input').attr('value', id);
            $el.find('span').text(ip);
            $form.find('#free-receivers').append($el);
        }
    }
    
    function showForm() {
        $addReceiver.addClass('hidden');
        $form.removeClass('hidden');
    }
    
    function hideForm() {
        $form.addClass('hidden');
        $form.find('#free-receivers').empty();
        $addReceiver.removeClass('hidden');  
    }
    
    function initForm() {
        $form.submit(function(e) {
            e.preventDefault();
            var id = $form.find('input:checked').val();
            var ip = $form.find('input:checked').parent().find('span').text();
            Backend.addReceiver(id, ip);
        });
        $form.find('.cancel').click(function(e) {
            hideForm();       
        });
    }
    
    return {
        Backend: Backend,
        init: function(receivers) {
            $addReceiver.click(function(e) {
                Backend.getFreeReceivers();
            });

            initForm();
        },
        addReceiver: function(id, ip) {
            $receivers.append(makeReceiverElement(id, ip));
            incrementCount(1);
        },
        removeReceiver: function(id) {
            $receivers.find('.receiver').each(function() {
				if ($(this).attr('id') === id) {
					$(this).remove();
					return;
				}
			});
            incrementCount(-1);
        }
    };
}();

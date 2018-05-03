var RoomController = function() {
    var $rooms = $('#rooms .list-group');
    var $createRoom = $('.create-room');
    var $form = $('#room-form');
    
    var Backend = {
        createRoom: function(name, password) {
            return $.ajax({
                type: 'POST',
                data: {
                    'name': name,
                    'password': password
                },
                url: '/rooms',		
                success: function(data, status, jqXHR) {
                    // redirect user to newly created room
                    window.location.replace(data.href);
                },
                error: function(jqXHR, status, err) {}
            });
        }
    };

    function makeRoomElement(id, name, href, receivers, locked) {
        var $el = $('#rooms .placeholder .room').clone();
        $el.attr('id', id);
        $el.find('.info').text(name);
        $el.attr('href', href);
        $el.find('.receiver-count').text((receivers == 1) ? '1 speaker' : receivers + ' speakers');
        if (locked) {
            $el.find('.fa-lock').removeClass('hidden'); 
		} else {
            $el.find('.fa-unlock').removeClass('hidden');
        }
        return $el;
    }
    
    function showForm() {
        $createRoom.addClass('hidden');
        $form.removeClass('hidden');   
    }
    
    function hideForm() {
        $form.addClass('hidden');
        $createRoom.removeClass('hidden');   
    }
    
    function initForm() {
        $form.submit(function(e) {
            e.preventDefault();     
            var name = $form.find('#inputName').val();
            var password = $form.find('#inputPassword').val();
            Backend.createRoom(name, password ? password : null);
        });
        $form.find('.cancel').click(function(e) {
            hideForm();
        });
    }
    
    return {
        init: function(rooms) {
            $createRoom.click(function(e) {
                showForm();
            });
            
            initForm();

            for (var i = 0; i < rooms.length; i++) {
                $rooms.append(makeRoomElement(rooms[i].id, rooms[i].name, rooms[i].href, rooms[i].receivers, rooms[i].locked));
            }
        }
    };
}();

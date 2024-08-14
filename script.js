document.addEventListener('DOMContentLoaded', function() {
    // Inicializa Flatpickr para el campo de entrada de fecha
    flatpickr('#calendar', {
        locale: 'es', // Configura el idioma a español
        dateFormat: 'd/m/Y', // Formato de fecha
        minDate: 'today', // Opcional: Configura la fecha mínima a hoy
        onChange: function(selectedDates, dateStr, instance) {
            // Actualiza las opciones de tiempo cuando se cambie la fecha
            updateAvailableTimes();
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
    flatpickr("#calendar", {
        dateFormat: "d/m/Y",
        locale: "es"
    });

    document.getElementById('book-button').addEventListener('click', bookAppointment);
    document.getElementById('calendar').addEventListener('change', populateTimeOptions);
    document.getElementById('professional').addEventListener('change', populateTimeOptions);

    // Mostrar el modal de autenticación al presionar el botón de administración
    document.getElementById('admin-button').addEventListener('click', showAdminModal);

    document.getElementById('admin-auth-btn').addEventListener('click', authenticateAdmin);

    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', () => {
            hideAdminModal();
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === document.getElementById('admin-auth-modal')) {
            hideAdminModal();
        }
    });
});


    // Definir horarios disponibles para cada profesional
    const professionalSchedules = {
        'Nicolas': {
            startHour: 11,
            endHour: 19,
            interval: 40
        },
        'Lautaro': {
            startHour: 11,
            endHour: 19,
            interval: 40
        }
    };

    // Objeto para mantener los tiempos reservados por fecha y profesional
    const reservedTimes = {};

    // Función para actualizar las horas disponibles
    function updateAvailableTimes() {
        const date = document.getElementById('calendar').value;
        const professional = document.getElementById('professional').value;

        if (!professional) {
            alert('Selecciona un profesional.');
            return;
        }

        const schedule = professionalSchedules[professional];
        if (!schedule) {
            alert('Horario no disponible para el profesional seleccionado.');
            return;
        }

        const reservedTimesForDate = reservedTimes[date] && reservedTimes[date][professional] ? reservedTimes[date][professional] : [];
        populateTimeOptions(schedule, reservedTimesForDate);
    }

    // Función para rellenar el select con horarios
    function populateTimeOptions(schedule, reservedTimes = []) {
        const timeSelect = document.getElementById('time');
        const { startHour, endHour, interval } = schedule;

        // Vacía el select antes de rellenarlo
        timeSelect.innerHTML = '';

        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minutes = 0; minutes < 60; minutes += interval) {
                if (hour === endHour && minutes > 60 - interval) break; // Limita el último turno
                const hourDisplay = hour < 10 ? `0${hour}` : hour;
                const minutesDisplay = minutes === 0 ? '00' : minutes;
                const optionValue = `${hourDisplay}:${minutesDisplay}`;
                const optionText = `${hourDisplay}:${minutesDisplay}hs`; // Muestra la hora en formato 24h con "hs"

                const option = document.createElement('option');
                option.value = optionValue;
                option.textContent = optionText;

                // Solo añade opciones que no están reservadas para la fecha actual y el profesional seleccionado
                if (!reservedTimes.includes(option.value)) {
                    timeSelect.appendChild(option);
                }
            }
        }
    }

    // Inicializa el cliente de Google API
    function initClient() {
        gapi.client.init({
            clientId: '83227640060-kov52dchuleorkhmsdp3cagbqqsjl2fo.apps.googleusercontent.com',
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
            scope: 'https://www.googleapis.com/auth/calendar'
        }).then(function () {
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        });
    }

    function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
            console.log('Signed in');
        } else {
            console.log('Not signed in');
        }
    }

    function handleAuthClick() {
        gapi.auth2.getAuthInstance().signIn();
    }

    function handleSignoutClick() {
        gapi.auth2.getAuthInstance().signOut();
    }

    function addEventToCalendar(event) {
        const name = document.getElementById('name').value;
        const professional = document.getElementById('professional').value;
        const service = document.getElementById('service').value;
        const date = document.getElementById('calendar').value;
        const formattedDate = formatDate(new Date(date.split('/').reverse().join('/')));
    
        const eventDetails = {
            'summary': `Cita con ${name}`,
            'location': 'Dirección de la peluquería',
            'description': `Cliente: ${name}\nProfesional: ${professional}\nServicio: ${service}\nFecha: ${formattedDate}\nHora: ${event.start.split('T')[1].slice(0, 5)} - ${event.end.split('T')[1].slice(0, 5)}`,
            'start': {
                'dateTime': event.start,
                'timeZone': 'America/Argentina/Buenos_Aires'
            },
            'end': {
                'dateTime': event.end,
                'timeZone': 'America/Argentina/Buenos_Aires'
            },
            'reminders': {
                'useDefault': false,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 10}
                ]
            }
        };
    
        gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': eventDetails
        }).then(function(response) {
            console.log('Evento creado: ' + response.result.htmlLink);
        });
    }
    

    function loadGapi() {
        gapi.load('client:auth2', initClient);
    }

    document.addEventListener('DOMContentLoaded', loadGapi);

    // Función para reservar una cita
    function bookAppointment() {
        const name = document.getElementById('name').value;
        const date = document.getElementById('calendar').value;
        const time = document.getElementById('time').value;
        const professional = document.getElementById('professional').value;
        const service = document.getElementById('service').value; // Nuevo campo para el servicio

        if (name && date && time && professional && service) {
            const appointmentList = document.getElementById('appointment-list');
            // Usa date-fns para formatear la fecha
            const formattedDate = formatDate(new Date(date.split('/').reverse().join('/')));
            const listItem = document.createElement('li');
            listItem.textContent = `${name} - ${formattedDate} - ${time}hs - ${professional} - ${service}`; // Incluye el servicio en la reserva
            appointmentList.appendChild(listItem);

            // Añadir el tiempo reservado para la fecha y el profesional seleccionado
            if (!reservedTimes[date]) {
                reservedTimes[date] = {};
            }
            if (!reservedTimes[date][professional]) {
                reservedTimes[date][professional] = [];
            }
            reservedTimes[date][professional].push(time);

            // Convertir la fecha y la hora a un formato que Date pueda entender
            const [day, month, year] = date.split('/').map(Number);
            const [hours, minutes] = time.split(':').map(Number);

            // Construir la fecha y la hora de inicio
            const startTime = new Date(year, month - 1, day, hours, minutes);
            const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

            // Validar si las fechas son correctas
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
                console.error('Fecha o hora no válidas');
                return;
            }

            // Añadir el evento al calendario de Google
            addEventToCalendar({
                start: startTime.toISOString(),
                end: endTime.toISOString()
            });

            // Actualiza el desplegable de horas
            updateAvailableTimes();

            // Mostrar modal correspondiente
            let modalId = '';
            if (professional === 'Nicolas') {
                modalId = 'nicolas-modal';
            } else if (professional === 'Lautaro') {
                modalId = 'lautaro-modal';
            }

            if (modalId) {
                const modal = document.getElementById(modalId);
                if (modal) {
                    const closeBtn = modal.querySelector('.close-btn');
                    const whatsappLink = modal.querySelector('#whatsapp-link');

                    

            // Limpiar el formulario
            document.getElementById('name').value = '';
            document.getElementById('calendar').value = '';
            document.getElementById('time').value = '';
            document.getElementById('professional').value = '';
            document.getElementById('service').value = ''; // Limpia el campo de servicio
        } else {
            alert('Por favor, completa todos los campos.');
        }
    }

    // Función para formatear la fecha
    function formatDate(date) {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = days[date.getDay()];
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        return `${dayName} ${day}/${month}`;
    }

    // Inicializa el desplegable con todas las horas disponibles
    updateAvailableTimes();

    // Añade el evento de clic al botón
    document.querySelector('#book-button').addEventListener('click', bookAppointment);

     // Función para mostrar el modal de confirmación solo para el administrador
    function showConfirmationModal() {
        const isAdmin = prompt('Ingresa la contraseña del administrador:'); // Solicita la contraseña
        if (isAdmin === 'nico1234') { // Verifica la contraseña
            document.querySelector('.reservations').style.display = 'block'; // Muestra la lista de reservas
        } 
    }

    // Mostrar el modal de confirmación solo al administrador
    showConfirmationModal();
});

// Función para obtener todos los documentos de la colección 'Reserva'
function getAllReservations(db) {
    db.collection('reservas').get()
    .then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            console.log(doc.id, ' => ', doc.data());
        });
        console.log('FIN');
    })
    .catch((error) => {
        console.error('Error obteniendo documentos: ', error);
    });
}

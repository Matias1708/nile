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

            // Añade el tiempo reservado para la fecha y el profesional seleccionado
            if (!reservedTimes[date]) {
                reservedTimes[date] = {};
            }
            if (!reservedTimes[date][professional]) {
                reservedTimes[date][professional] = [];
            }
            reservedTimes[date][professional].push(time);

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

                    // Generar el mensaje de WhatsApp
                    const phoneNumber = '1137927556'; // Reemplaza con tu número de WhatsApp
                    const message = `Hola, mi nombre es ${name}. Quisiera confirmar mi turno el ${formattedDate} a las ${time} con ${professional} para ${service}.`;
                    const encodedMessage = encodeURIComponent(message);
                    whatsappLink.href = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

                    modal.style.display = 'block';

                    closeBtn.onclick = function() {
                        modal.style.display = 'none';
                    }

                    window.onclick = function(event) {
                        if (event.target === modal) {
                            modal.style.display = 'none';
                        }
                    }
                } else {
                    console.error(`No se encontró el modal con ID: ${modalId}`);
                }
            }

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
});

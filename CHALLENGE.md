# Prueba Técnica Backend Engineer

IO es un neobanco innovador en Perú que ofrece una experiencia financiera completamente digital a través de su aplicación móvil. Como Backend Engineer, se te ha asignado el diseño e implementación de un nuevo proceso de emisión de tarjetas exclusivo para nuevos cliente utilizando una arquitectura basada en eventos. El equipo de negocio ha establecido una regla clave: cada cliente solo puede solicitar y se acreedor de una única tarjeta.

El proceso de emisión de tarjetas consta de los siguientes pasos:

1. La solicitud inicia vía una solicitud HTTP por REST API, se valida y publica un evento con estado pendiente.

2. Un servicio consumidor procesa la emisión del evento anterior.

3. En el caso la operación sea exitosa, el servicio consumidor simula la aprobación y publica un nuevo evento con estado emitido.

4. En el caso la operación no sea exitosa, puede reintentar cada 1s, 2s, 4s con un máximo de 3 reintentos según corresponda.

5. En el caso se agoten los reintentos se publica un nuevo evento al DLQ.

**Componentes técnicos mínimos sugeridos:**

1. **card-issuer (Rest API)**

* Endpoint POST /cards/issue.

* Valida payload.

* Genera requestId.

* Publica en Kafka el evento al tópico io.card.requested.v1.

* Almacena la información en una base de datos local. (o en memoria)

* Responde con { requestId, status }.

2. **card-processor (Consumer)**

* Escucha el evento io.card.requested.v1.

* Implementar un método que simule carga externa (ej: tardar entre 200–500 ms) y tenga un algoritmo aleatorio de éxito o fallo. 

* Implementar un flag en el payload en caso se requiera forzar el error más de 3 veces seguido.

* Contruye el proceso de “emisión de tarjeta” con los datos necesarios para una tarjeta como id, número de tarjeta, fecha de vencimiento, cvv.

* En caso de éxito, actualiza la información en la base de datos local y publica el evento en io.cards.issued.v1 con estado emitido.

* En caso de error, se requiere reintentar el proceso por un máximo de 3 veces.

* Si falla tras el máximo número de reintentos, publica en io.card.requested.v1.dlq con la razon, intentos y payload original. 

3. **Estructuras de datos**:

Contrato referencial para **issuer-api:**

Tener en cuenta el formato y valores permitidos de los siguiente datos:

* DocumentType: Formato DNI
* Email
* Age
* Type: Solo VISA
* Currency: PEN o USD

```json
{
	"customer": {
		"documentType": "DNI",
		"documentNumber": "11654321",
		"fullName": "Jose Perez",
		"age": 25,
		"email": "joseperez@example.com"
	},
	"product": {
		"type": "VISA",
		"currency": "PEN"
	},
	"forceError": false
}
```


Se propone una estructura basada en [CloudEvents](https://github.com/cloudevents/spec/blob/main/cloudevents/spec.md#data) en donde:

* id: Numero auto incremental por cada evento en la ejecución  
* source: UUID compartido que identifica a un flujo de ejecución  
* data: Datos del evento  
* data.error: Detalles del error en caso sea necesario  
* type: Tipo del evento

```json
	{
		"id": 1,
		"source":"09de4679-1e1e-45d8-aec3-7a943f734cc5",
		"data": {
			// ...,
			"error": {}
		},
		"type": "io.topic-name.v1"
	}
```

**Requisitos técnicos:**

* Node.js ≥ 20+ TypeScript.

* KafkaJS (productor y consumidor)

* Docker Compose con Kafka.

* Buenas prácticas en manejo de eventos.

* Garantizar la confiabilidad del código.

* Monitoreo claro obligatorio. 

* Implementar prácticas de desarrollo seguro. 

* Readme con la ejecución del proyecto. 

* Considerar una arquitectura modular y el desacoplamiento de componentes

*En caso de duda por algún enunciado ambiguo, asume/propone el mejor camino de solución y luego en sesión de revisión se sustenta.*
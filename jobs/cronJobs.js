const cron = require('node-cron');
const { getAllJobs,getJobsByUrlSize,updateExisteStock } = require('../models/request.model');

const { Builder, By, Key } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { Options } = require('selenium-webdriver/chrome');

/**
 * Método programado que verifica la disponibilidad de productos en las URL almacenadas en la base de datos.
 * - Recupera las requests almacenadas en la base de datos.
 * - Para cada petición, busca la disponibilidad de la size del producto en la URL correspondiente.
 * - Si encuentra el producto y la size está disponible, envía un correo electrónico al user y actualiza la base de datos.
 * - Si no hay requests o si ocurre algún error, se registra en la consola.
 */
cron.schedule('*/1 * * * *', async () => {
    console.log('pasando');
    try {
        //Consultamos si hay requests a buscar agrupando entre ellas para optimizar resultados
        const [requests] = await getAllJobs();
        if (!requests || requests.length == 0) {
            console.log('No hay requests actualmente');
            return;
        }
        
        //Si hay requests, iterar sobre ellas y buscar si existe la size en la url solicitada
        const arrayResultados = [];
        for (let request of requests) {
            const resultadoRequest = await verificarDisponibilidad(request);
            if (resultadoRequest!= null) {
                let resultadoToArray = {request: request,resultadoRequest: resultadoRequest};
                arrayResultados.push(resultadoToArray)
            }
        }
        
        //Recorremos los resultados y los actualizamos y enviamos si es necesario
        if (arrayResultados.length > 0) {
            for (let itemResultados of arrayResultados) {
                enviarActualizarRequestUsers(itemResultados.request, itemResultados.resultadoRequest);
            }
        }
        
    } catch (error) {
        console.error('Error al ejecutar la tarea programada:', error);
    }
});


/**
* Función para verificar la disponibilidad de una size en una URL específica.
* @param {Object} request - Objeto que contiene la información de la petición, incluyendo el ID, size y URL.
* @returns {Object|null} - Objeto con el ID, size, URL y mensaje de disponibilidad, o null si la size no está disponible.
*/
const verificarDisponibilidad = async (request) => {
   const resultados = {
    hayStock: false,
    sinStock: false,
    noExiste: false,
   }
   try {
       // Recuperamos los parámetros de la petición
       const sizeElegida = request.size ? request.size.toUpperCase() : null;
       const url = request.url ? request.url : null;
        
       // Verificar si los parámetros existen
       if (!sizeElegida || !url) {
           return null; 'Faltan parámetros en la petición'
       }
       
       // Configuración de opciones para el navegador Chrome
       const options = new Options().addArguments('--disable-dev-shm-usage', '--no-sandbox');

       // Iniciar el navegador con las opciones configuradas
       const driver = await new Builder()
           .forBrowser('chrome')
           .setChromeOptions(options)
           .build();
           
       try {
           // Cargar la página deseada
           await driver.get(url);
           const ulElement = await driver.findElement(By.css('ul[id*="product-size-selector"]'));
           const liElements = await ulElement.findElements(By.tagName('li'));
           
           // Obtener la clase de la size para determinar si está disponible
           let sizeEncontrada = false;
           let stockDisponible = false;
           for (let i = 0; i < liElements.length; i++) {
               const li = liElements[i];
               const productSizeInfoMainLabel = await li.findElement(By.xpath('.//*[@data-qa-qualifier="product-size-info-main-label"]'));
               if (!productSizeInfoMainLabel ) {
                   continue;
               }
               
               const productSizeLabelValue = await productSizeInfoMainLabel.getText();
               if (productSizeLabelValue.toUpperCase() === sizeElegida) {
                   sizeEncontrada = true;
                   const dataQAAction = await li.getAttribute('data-qa-action');
                   if (dataQAAction === 'size-low-on-stock' || dataQAAction === 'size-in-stock') {
                       stockDisponible = true;
                   }
                   break;
               }
           }

           if (!sizeEncontrada && !stockDisponible) {
                resultados.noExiste = true; 
           } else if (sizeEncontrada && !stockDisponible){
                resultados.sinStock = true;
           } else {
                resultados.hayStock = true;
           }
           return resultados;

       } catch (e) {
           return null; // Error al cargar la página, devolver null
       } finally {
           if (driver) {
               await driver.quit(); // Cerrar el navegador al finalizar la operación
           }
       }
   } catch (error) {
       return null; // Error inesperado, devolver null
   }
};


/**
* Función para actualizar los registros de requests  e enviar un correo al user si hay stock
* @param {Object} request - Objeto que contiene la información de la petición, incluyendo el ID, size y URL.
* @returns  - Void.
*/
const enviarActualizarRequestUsers = async (requestEncontrada,resultadoRequest) => {
    let is_existe_value = 0;
    let is_stock_value = 0;
    let message = "";

    //Actualizamos campos a procesar en la query y en el update
    if (resultadoRequest.hayStock) {
        is_existe_value = 1;
        is_stock_value = 1;
        message = "Hay Stock. ";
    } else if (resultadoRequest.sinStock) {
        is_existe_value = 1;
        is_stock_value = 0;
        message = "No hay Stock. ";
    } else {
        is_existe_value = 0;
        is_stock_value = 0;
        message = "No existe. ";
    }

    //Se buscan los registros a actualizar
    const [consultaRequests] = 
        await getJobsByUrlSize(requestEncontrada.url, requestEncontrada.size,{ is_existe: is_existe_value, is_stock: is_stock_value });

    //Si no hay nada que actualizar no se procesan registros
    if (!consultaRequests || consultaRequests.length === 0) {
        console.log(`No hay nada que actualziar con la url ${requestEncontrada.url} y la size ${requestEncontrada.size}`);
        return;
    }
    
    // Iteramos sobre los resultados devueltos por la consulta
    for (let request of consultaRequests) {
        //Se actualiza el registro y envia un correo electrónico
        await updateExisteStock(request.id, { is_existe: is_existe_value, is_stock: is_stock_value });
        console.log(`${message} Se ha actualizado la petición ${request.id}`);
    }
};

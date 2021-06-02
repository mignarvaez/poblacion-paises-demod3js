//Dirección URL de la API de donde se obtendrá la información.
const API_URL = 'https://restcountries.eu/rest/v2/region/Americas';

//Se crea la función encargada de obtener la información de los 10 paises más poblados de America
//La función es asincrona. 
const getData = async () => {
  //Se usa el api FETCH para traer los resultados
  const reponse = await fetch(API_URL);
  //Los resultados se parsean en formato json
  const result = await reponse.json();
  // Ordena según la población
  // El método sort() ordena los elementos de un arreglo (array) localmente y devuelve el arreglo ordenado.
  // Convierte por defecto los números en string, por tanto para comparar números se debe especificar en la función flecha
  // de comparación la sustracción b(primer elemento) de a(segundo elemento).
  const dataSort = result.sort((a, b) => b.population - a.population);
  // Se conservan los 10 primeros
  dataSort.length = 10;

  // El método map() crea un nuevo arreglo con los resultados de llamar la función que se le pase en cada elemento del array
  // En este caso con la función se busca conservar solamente su nombre nativo como el nombre del país y su población.
  const dataReady = dataSort.map((country, index) => ({
    rank: index + 1,
    name: country.nativeName,
    //Se divide entre un millon y se redondea para mostrar el gráfico de manera más sencilla
    population: Math.floor(country.population / 1000000),
  }));
  console.log(dataReady);
  return dataReady;
};

//Está función es la encargada de generar el gráfico de barras
const generateChart = (popData) => {
  //Se crea un objeto que define el margén del area de trabajo
  const margin = {
    top: 20,
    right: 40,
    bottom: 60,
    left: 80,
  };
  //Se configura el ancho y el alto del gráfico
  const width = 1000 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Se crea el elemento svg, indicandole el objeto del DOM que usara, en este caso el de id "chart"
  // Luego agrega el elemento de nombre svg, con attr se le indica al elemento svg el ancho y alto
  // Luego agregae el elemento g, que se usa para agrupar figuras SVG. En este caso se agrupan las figuras anteriores
  // y se les aplica una traslación en los ejes según el margen izquierdo y superior
  const svgElement = d3
    .select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Se agrega el eje x
  // Se crea un escala de banda especificandole un rango como una matriz de valores, que va desde 0 hasta el ancho
  // Luego se le indica el dominio que en este caso consiste el nombre de los paises que vienen en el arreglo denominado popData
  // el dominio es el numero de bandas o barras que apareceran.
  // Luego se aggrega un elemento svg al que se le agregan con la función append 'g' todas las bandas creadas
  // Se aplica una traslación teniendo en cuenta la altura y se invoca con call a la funcion axisBottom una sola vez pasandole el objeto
  // agrupado y retornandolo luego de aplicarle la funcion mencionada.
  // La funcion axisbottom crea un eje horizontal(x)
  const xScale = d3
    .scaleBand()
    .range([0, width])
    .domain(popData.map((s) => s.name))
    .padding(0.2);
  svgElement
    .append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale));

  // Se agrega el eje y
  // scaleLinear crea una escala con una relación lineal que dibujara las barras
  // Esta funcion recibe en su dominio los valores de la población los paises requeridos
  // y los mapea según el rango para distribuirlos, en este caso teniendo como limite la altura.
  // Se agregan las barras creadas y se crea un eje vertical con axisleft
  const yScale = d3
    .scaleLinear()
    .domain([popData[0].population, popData[9].population])
    .range([0, height]);
  svgElement.append('g').call(d3.axisLeft(yScale));

  // Se agrega una grilla en el eje vertical indicandole el formato deseado
  // en este caso vacio ''. osea solo dibujo las lineas
  svgElement
    .append('g')
    .call(d3.axisLeft(yScale).ticks().tickSize(-width).tickFormat(''));

  // Se dibujan las barras, en el objeto de clase barra
  // pasandole el arreglo que tiene la población y nombre del top 10 de paises más poblados de america
  // La función enter agregara un elemento a cada elemento seleccionado, en este caso a cada bar
  // este elemento será un rectangulo, pertenecerá a la clase bar y tendrá como elemento en su eje x
  // el nombre del pais, el ancho será asignado con el bandwidth de la escala, en el eje y se dibujara según la poblacion el valor en el eje y
  // la altura sera 0 y se llenara con el color hexadecimal indicando, se la aplicarán transiones con una duracion de 750 ms
  // El limite del gráfico se ajustara a la altura del gráfico y la escala de los valores de cada población
  svgElement
    .append('g')
    .selectAll('.bar')
    .data(popData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => xScale(d.name))
    .attr('width', xScale.bandwidth())
    .attr('y', (d) => yScale(d.population))
    .attr('height', 0)
    .style('fill', '#ABEEAA')
    .transition()
    .duration(750)
    .attr('height', (d) => height - yScale(d.population));

  // se crea un tooltip (elemento que muestra información adicional cuando se pasa por con el mouse o se hace focus con el teclado
  // sobre alguno de los elementos del gráfico. En este caso será el nombre del pais y su población). En este apartado simplemente
  // Se seleccionan los elementos
  const tooltip = d3.select('#tooltip');
  const tooltip_name = d3.select('#country_name');
  const tooltip_pop = d3.select('#country_population');

  // Se agrega el evento para mostrar información cuando se pase el mouse por encima de alguna de las barras
  // Se seleccionan todas las barras, se le agrega la funcion mouse over, el cuál se pone de un culor diferente
  // y cambia la visibilidad del tooltip.
  // Al detectar el movimiento luego de haberse puesto sobre una barra se agrega el texto del tooltip, en este caso el nombre y la población del país
  // En mousemove el parametro d representa el objeto al que esta asociada la barra sobre la que se está pasando encima
  // Una vez se quite el puntero de una barra se remueve el tooltip y se regresa el color inicial de la misma.
  d3.selectAll('.bar')
    .on('mouseover', function () {
      d3.select(this).style('fill', '#daffd9');
      tooltip.style('visibility', 'visible');
    })
    .on('mousemove', function (e, d) {
      tooltip
        .style('top', e.pageY - 10 + 'px')
        .style('left', e.pageX + 10 + 'px');
      tooltip_name.text(d.name);
      tooltip_pop.text(`Población: ${d.population} Millones`);
    })
    .on('mouseout', function () {
      d3.select(this).style('fill', '#ABEEAA');
      tooltip.style('visibility', 'hidden');
    });

  // Configura el texto para el eje y
  svgElement
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', 'white')
    .text('Población (en millones)');

  // Configura el texto para el eje X
  svgElement
    .append('text')
    .attr('y', height + 30)
    .attr('x', 0 + width / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', 'white')
    .text('País');
};

//Se llama a la función getData a modo de promesa para que, si no se genera un error, pueda generar el grafico con la función generateChart
getData().then(generateChart);
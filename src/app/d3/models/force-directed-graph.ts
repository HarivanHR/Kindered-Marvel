
import { EventEmitter } from '@angular/core';
import APP_CONFIG from '../../app.config';
import { Link } from './link';
import { Node } from './node';
import * as d3 from 'd3';
import { FORCES } from '../d3.forces';



export class ForceDirectedGraph {
  public ticker: EventEmitter<d3.Simulation<Node, Link>> = new EventEmitter();
  public simulation: d3.Simulation<any, any>;

  public nodes: Node[] = [];
  public links: Link[] = [];

  constructor(nodes, links, options: { width, height }) {
    this.nodes = nodes;
    this.links = links;

    this.initSimulation(options);
  }

  connectNodes(source, target) {
    let link;

    if (!this.nodes[source] || !this.nodes[target]) {
      throw new Error('One of the nodes does not exist');
    }

    link = new Link(source, target);
    this.simulation.stop();
    this.links.push(link);
    this.simulation.alphaTarget(0.3).restart();

    this.initLinks();
  }

  initNodes() {
    if (!this.simulation) {
      throw new Error('simulation was not initialized yet');
    }

    this.simulation.nodes(this.nodes);
  }

  initLinks() {
    if (!this.simulation) {
      throw new Error('simulation was not initialized yet');
    }

    // Initializing the links force simulation
    this.simulation.force('links',
      d3.forceLink(this.links)
        .distance(FORCES.link.distance)
        .id((d: Node) => d.id)
        // .strength(FORCES.link.strength)
        .strength((link,_,__) => link.strength / 30)
    );
  }

  initSimulation(options) {
    if (!options || !options.width || !options.height) {
      throw new Error('missing options when initializing simulation');
    }

    /** Creating the simulation */
    if (!this.simulation) {
      const ticker = this.ticker;

      // Creating the force simulation and defining the charges
      this.simulation = d3.forceSimulation()
        .force('charge',
          d3.forceManyBody()
            .strength((d: Node) => FORCES.charge.strength * d.r)
        )
        .force('collide',
          d3.forceCollide()
            .strength(FORCES.collide.strength)
            .radius((d: Node) => d.r + 5).iterations(2)
        );

      // Connecting the d3 ticker to an angular event emitter
      this.simulation.on('tick', function() {
        ticker.emit(this);
      });

      this.initNodes();
      this.initLinks();
    }

    /** Updating the central force of the simulation */
    this.simulation.force('centers', d3.forceCenter(options.width / 2, options.height / 2));

    /** Restarting the simulation internal timer */
    this.simulation.restart();
  }
}

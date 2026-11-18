import { ServicePictogram } from "@/components/ServicePictogram";
import { services } from "@/data/services";

export function Services() {
  return (
    <section id="services" className="services" aria-labelledby="services-title">
      <h2 id="services-title" className="section-title">
        Services
      </h2>
      {services.map((service) => (
        <div key={service.pillar} className="service-row" data-pillar={service.pillar}>
          <div className="service-head">
            <ServicePictogram pillar={service.pillar} />
            <h3 className="service-name">{service.pillar}</h3>
          </div>
          <div>
            <p className="service-when">{service.when}</p>
            <p className="service-body">{service.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

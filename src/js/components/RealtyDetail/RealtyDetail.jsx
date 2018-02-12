import React, {Component} from 'react';
import {Row, Col, ListGroup, ListGroupItem, Button, UncontrolledCarousel, FormGroup, Label, Input} from 'reactstrap';
import styles from './realty.scss';


const mockedData = {

  title: "Prodej rodinného domu 127 m², pozemek 201 m²",
  locality: "V. Hermacha, Stehelčeves",
  price: "4 680 000 Kč",
  text: "Nabízíme hezkou novostavbu 5+1 s velkou užitnou plochou 127 m2 ve Stehelčevsi. Žádaná lokalita pro velmi dobrou dostupnost do Prahy 6 – 4 minuty po R7. Dům je z nadstandardních materiálů včetně obložkových zárubní, kotle Vaillant, podlahového topení, 2 parkovacích míst ze zámkové dlažby, oplocení a podobně. Domy v této lokalitě jsou v klasickém anglickém stylu. Obec má velmi slušnou občanskou vybavenost. Přímo v lokalitě se nachází sportoviště. V nabídce máme také krajové domy a domy v jiných lokalitách za nižší ceny. Máte-li zájem o bližší informace, navštivte naše webové stránky nebo nás neváhejte kontaktovat. Přijďte se přesvědčit, že naše nabídka je reálná.",
  gallery: [
    {
      src: 'https://i.pinimg.com/originals/2b/fb/6b/2bfb6b646097abbc26d218b78370c5c9.jpg',
      altText: 'Slide 1',
      caption: ""
    },
    {
      src: 'https://cdn.houseplans.com/product/o2d2ui14afb1sov3cnslpummre/w1024.jpg?v=15',
      altText: 'Slide 2',
      caption: ""
    }
  ],
  contact: {

    name: "Roman Kočvara",
    phone: "+420 608 149",
    email: "kocvara@oxes.cz",
    image: "https://orig00.deviantart.net/d8af/f/2009/096/0/2/prison_break_by_sergiotoribio.jpg"

  }

};

export default class ResultContent extends Component {

  constructor(props) {
    super(props);

  }

  render() {
    return (
      <div className={styles.container}>
        <UncontrolledCarousel items={mockedData.gallery} autoPlay={false}/>
        <h2 className={"mt-4"}>
          {mockedData.title}
        </h2>
        <h4 className={"text-muted"}>
          {mockedData.locality}
        </h4>
        <h2>{mockedData.price} €</h2>
        <p className={[styles.realtyInfo, "mt-4", "mb-4"].join(" ")}>
          {mockedData.text}
        </p>
        <Row>
          <Col xs={12} md={6}>
            <ListGroup>
              <ListGroupItem>
                <Row>
                  <Col>Celková cena</Col>
                  <Col>1 000 000 € za nehnuteľnosť</Col>
                </Row>
              </ListGroupItem>
            </ListGroup>
          </Col>
          <Col xs={12} md={6}>
            <ListGroup>
              <ListGroupItem>
                <Row>
                  <Col>Podlažie</Col>
                  <Col>5. podlaží z celkem 5.</Col>
                </Row>
              </ListGroupItem>
            </ListGroup>
          </Col>
        </Row>
        <Row className={"mt-5"}>
          <Col className={"text-center"}>
            {
              ["Pridať do obľúbených",
                "Zdielať inzerát",
                "Tlačiť",
                "Pridať poznámku"
              ].map(value =>
                <Button key={value} outline color="primary" className={"mr-3"}>{value}</Button>
              )}
          </Col>
        </Row>
        <form method="post" className={[styles.contactForm, "mt-4", "pt-4"].join(" ")}>
          <h2 className={"mb-4"}>
            Kontaktovať:
          </h2>
          <Row className={"mb-4"}>
            <Col sm={2} md={2} >
                <div className={[styles.profilePicture,"mb-4"].join(" ")} >
                  <img
                    src={mockedData.contact.image ? mockedData.contact.image : "https://upload.wikimedia.org/wikipedia/en/b/b1/Portrait_placeholder.png"}
                  />
                </div>
            </Col>
            <Col>
              <h5>{mockedData.contact.phone}</h5>
              <p className={"m-0"}><span className={"text-muted mr-3"}>Mobil:</span>+420 608 149</p>
              <p><span className={"text-muted mr-3"}>Email:</span>{mockedData.contact.email}</p>
            </Col>
          </Row>
          <FormGroup row>
            <Label sm={2}>Váš email</Label>
            <Col sm={6}>
              <Input type="email" name="email" placeholder="Email"/>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label sm={2}>Meno</Label>
            <Col sm={6}>
              <Input type="text" name="name" placeholder="Meno"/>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label sm={2}>Telefón</Label>
            <Col sm={6}>
              <Input type="text" name="phone" placeholder="Telefónne číslo"/>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label sm={2}></Label>
            <Col sm={6}>
              <Input type="textarea" name="text" style={{resize: "none", height: "100px"}}
                     placeholder="Dobrý deň mám záujem o Vašu ponuku..."/>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label sm={2}/>
            <Col sm={10}>
              <Label check>
                <Input type="checkbox" name="terms"/>{' '}
                Súhlasím so spracováním osobných údajov.
              </Label>
            </Col>
          </FormGroup>
          <FormGroup row>
            <Label sm={2}/>
            <Col sm={6} className={"text-center"}>
              <Button color={"primary"}>Odoslať</Button>
            </Col>
          </FormGroup>
        </form>
      </div>
    );
  }

}

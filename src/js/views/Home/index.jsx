import React from 'react';
import {Jumbotron, Button} from 'reactstrap';
import styles from './home.scss';

export default class Example extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {

    return (
      <div className={styles.container}>
        <div className="row h-25"/>
        <div className="row h-75">
          <div className="col-12">
            <div className="row">
              <div className="col-6 mx-auto">
                <Jumbotron className={styles.jumbo}>
                  <h1 className="display-3">Interaktivní nástroje pro spracování signálů</h1>
                  <p className="lead">Obsahuje aplikace demonstrující lineární regresi a metodu nejmenších čtverců,
                    interpolaci a rekonstrukci signálu ze vzorků, diskrétní lineární konvoluci a diskrétní křížovou
                    korelaci,
                    jejich cílem je podpořit výuku spracování signálů.
                    K navigaci mezi aplikacemi použijte levé, postraní menu.
                    Pokud naleznete chyby, neváhejte kontaktovat autora tlačítkem níže.
                  </p>
                  <hr className="my-2"/>
                  <p>Vytvořeno v rámci bakalářské práce, v akademickém roce 2017/2018. Autor: Ondrej Pacas 189079.</p>
                  <p className="lead">
                    <a href="mailto:xpacas01@vutbr.cz" target="_top" className="btn btn-primary">Kontakt</a>
                  </p>
                </Jumbotron>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

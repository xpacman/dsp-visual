import React, {Component} from 'react';
import {Form, FormGroup, Button, Label, Input} from 'reactstrap';
import {Link} from 'react-router-dom';
import styles from './resultlist.scss';

//will be result list
const realtyData = {

  realtyId: "b12ol",
  title: "Prenájom bytu 15m2",
  locality: "Na Chmelnici, Olomouc - Nová Ulice",
  price: "4 500 Kč za mesiac",
  images: [
    "https://cdn.houseplans.com/product/o2d2ui14afb1sov3cnslpummre/w560x373.jpg?v=15",
    "https://cdn.houseplans.com/product/o2d2ui14afb1sov3cnslpummre/w560x373.jpg?v=15",
    "https://cdn.houseplans.com/product/o2d2ui14afb1sov3cnslpummre/w560x373.jpg?v=15"
  ]

};


export default class ResultList extends Component {
  render() {
    return (
      <div>
        <h2 className="mb-4 text-center">
          Byty k prenájmu
        </h2>
        <div className="mb-4 text-center">
          <Button color="primary" className={"m-1"} >
            <Link to={"/hladanie/"}>Upraviť hľadanie</Link>
          </Button>
          <Button color="link" className={"m-1"}>Uložiť hľadanie</Button>
        </div>
        <Form className={[styles.sortControl, "mb-2"].join(" ")} inline>
          <FormGroup>
            <Input type="select" name="sort">
              {["Najnovšie", "Najlacnejšie", "Najdrahšie"].map((value, key) =>
                <option key={key}>{value}</option>
              )}
            </Input>
          </FormGroup>
          <FormGroup>
            <Label className="mr-3">inzerátov na stránke</Label>
            <Input type="select" name="pageresults">
              {[20, 40, 60].map((value, key) =>
                <option key={key}>{value}</option>
              )}
            </Input>
          </FormGroup>
        </Form>
        <div className={styles.resultContainer}>
          <div className={styles.imagesContainer}>
            {realtyData.images.map((value, key) =>
              <span key={key}>
                  <Link to={{pathname: '/detail'}}>
                    <img src={value}/>
                  </Link>
                </span>
            )}
          </div>
          <div className={styles.infoContainer}>
            <span><a>{realtyData.title}</a></span>
            <span className={styles.locality}>{realtyData.locality}</span>
            <span>{realtyData.price}</span>
          </div>
        </div>
      </div>
    )}
}

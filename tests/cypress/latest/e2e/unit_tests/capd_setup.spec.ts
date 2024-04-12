/*
Copyright © 2022 - 2023 SUSE LLC
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import '~/support/commands';
import * as cypressLib from '@rancher-ecp-qa/cypress-library';
import { qase } from 'cypress-qase-reporter/dist/mocha';
import * as utils from "~/support/utils";

Cypress.config();
describe('Enable CAPD provider', () => {
  const namespace = "capd-system"

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cypressLib.burgerMenuToggle();
  });

  qase(12,
    it('Create CAPD namespace', () => {
      cy.createNamespace(namespace);
    })
  );

  qase(13,
    it('Create CAPD provider', () => {
      cypressLib.checkNavIcon('cluster-management')
        .should('exist');

      // Open Turtles menu
      cy.accesMenuSelection('Cluster Management', 'CAPI');

      // Create CAPD Infrastructure provider
      cy.contains('Infrastructure Providers').click();
      cy.clickButton('Create from YAML')
      cy.readFile('./fixtures/capd-provider.yaml').then((data) => {
        cy.get('.CodeMirror')
          .then((editor) => {
            editor[0].CodeMirror.setValue(data);
          })
      })
      cy.clickButton('Create')
      cy.contains('Active ' + 'docker');

      cypressLib.burgerMenuToggle();
      cy.contains('local').click();
      cy.accesMenuSelection('Workloads', 'Deployments');
      cy.setNamespace(namespace);
      cy.contains('Active ' + 'capd-controller-manager').should('exist');
      cy.namespaceReset();
    })
  );

});

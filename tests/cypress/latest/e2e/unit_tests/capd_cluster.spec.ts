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
describe('Import CAPD', () => {
  const cluster = "cluster1-capi"
  const repo = "https://github.com/rancher-sandbox/rancher-turtles-fleet-example.git"

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cypressLib.burgerMenuToggle();
  });

  qase(14,
    it('Import CAPD cluster using fleet', () => {
      cypressLib.checkNavIcon('cluster-management')
        .should('exist');

      // Click on the Continuous Delivery's icon
      cypressLib.accesMenu('Continuous Delivery');
      cypressLib.accesMenu('Git Repos');

      // Change namespace to fleet-local
      cy.contains('fleet-').click();
      cy.contains('fleet-local')
        .should('be.visible')
        .click();

      // Add CAPD fleet repository
      cy.clickButton('Add Repository');
      cy.typeValue('Name', 'clusters');
      cy.typeValue('Repository URL', repo);
      cy.typeValue('Branch Name', 'main');
      
      // Create Git repo
      cy.clickButton('Next');
      cy.clickButton('Create');
      cy.contains('clusters').click();
    })
  );

  qase(15,
    it('Auto import child cluster via namespace annotation', {
      // Retry test once, to increase the effective timeout for cluster import
      retries: 1
    },
    () => {
      // Check child cluster cluster is created and auto-imported
      cypressLib.burgerMenuToggle();
      cy.contains('Pending ' + cluster, {timeout: 120000});
      
      // Check cluster is Active
      cy.clickButton('Manage');
      cy.contains('Active' + ' ' + cluster, {timeout: 120000});
    })
  );

  qase(16,
    it('Install App on imported cluster', () => {

      // Click on imported CAPD cluster
      cy.contains(cluster).click();
      cy.get('.nav').contains('Apps')
      .click();
      cy.contains('Monitoring', {timeout:30000})
        .click();
      cy.contains('Charts: Monitoring', {timeout:30000});

      // Install monitoring app
      cy.clickButton('Install');
      cy.contains('.outer-container > .header', 'Monitoring');
      cy.clickButton('Next');
      cy.clickButton('Install');

      // Close the shell to avoid conflict
      cy.get('.closer', {timeout:30000})
        .click();
      cy.contains('Only User Namespaces') // eslint-disable-line cypress/unsafe-to-chain-command
        .click()
        .type('cattle-monitoring-system{enter}{esc}', { delay: 1000});

      if (utils.isRancherManagerVersion('2.7')) {
        cy.reload();
      }
      // Resource should be deployed (green badge)
      cy.get('.outlet').contains('Deployed rancher-monitoring', {timeout: 240000});

    })
  );
  qase(17,
    it('delete the CAPD cluster repo', () => {
        // Go to 'Continuous Delivery'
        cypressLib.accesMenu('Continuous Delivery');
        // Click 'Git Repo' from the left navigation
        cypressLib.accesMenu('Git Repos');
        // Change the namespace to fleet-local using the dropdown on the top bar
        cy.contains('fleet-').click();
        cy.contains('fleet-local').should('be.visible').click();
        // Click the 'clusters' link
        cy.contains("clusters").click();
        cy.url().should("include","fleet/fleet.cattle.io.gitrepo/fleet-local/clusters")
        // Click on the actions menu and select 'Delete' from the menu
        cy.get('.actions .btn.actions').click();
        cy.get('.icon.group-icon.icon-trash').click();
        cypressLib.confirmDelete();
        // Wait until the following returns no clusters found:
        // kubectl get clusters.cluster.x-k8s.io
        cypressLib.accesMenu('Home');
        cy.contains(cluster).should('not.exist');
    })
    );

});

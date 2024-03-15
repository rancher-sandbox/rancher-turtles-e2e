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
  const repoName = 'clusters'
  const clusterShort = "cluster1"
  const clusterFull = "cluster1-capi"
  const repoUrl = "https://github.com/rancher-sandbox/rancher-turtles-fleet-example.git"

  beforeEach(() => {
    cy.login();
    cy.visit('/');
    cypressLib.burgerMenuToggle();
  });

  [ 'per-cluster-import',
    'main',
  ].forEach((branch) => {

  qase(14,
    it('Import CAPD cluster using fleet', () => {
      cypressLib.checkNavIcon('cluster-management')
        .should('exist');

      // Click on the Continuous Delivery's icon
      cy.deleteAllFleetRepos();
      cypressLib.burgerMenuToggle();
      cy.accesMenuSelection('Cluster Management', 'CAPI');
      cy.contains("CAPI Clusters").click();
      cy.contains(clusterShort).should('not.exist', {timeout:60000});

      // Add CAPD fleet repository
      cypressLib.burgerMenuToggle();
      cy.addFleetGitRepo({ repoName, repoUrl, branch });
      cy.clickButton('Create');  
      cy.contains(repoName).click();
    })
  );

  qase(15,
    it('Auto import child cluster via "${branch}" annotation', () => {
      if (branch == 'main') {
        cy.namespaceAutoImport('Enable');
      }
      // Check child cluster is created and auto-imported
      cy.visit('/');
      cy.contains('Pending ' + clusterFull, {timeout: 120000});
      
      // Check cluster is Active
      cy.clickButton('Manage');
      cy.contains('Active ' + clusterFull, {timeout: 180000});

      cy.checkCAPICluster(clusterShort);
    })
  );

  qase(16,
    it('Install App on imported cluster', () => {

      // Click on imported CAPD cluster
      cy.contains(clusterFull).click();
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
      cy.setNamespace('cattle-monitoring');

      if (utils.isRancherManagerVersion('2.7')) {
        cy.reload();
      }
      // Resource should be deployed (green badge)
      cy.get('.outlet').contains('Deployed rancher-monitoring', {timeout: 240000});
      cy.namespaceReset();
    })
  );

  qase(16,
    it('Remove an imported cluster from Rancher Manager', () => {
      cypressLib.burgerMenuToggle();
      cy.clickButton('Manage');
      cy.contains('Active' + ' ' + clusterFull);

      cy.viewport(1920, 1080);
      cy.get('.input-sm')
        .click()
        .type(clusterFull);
      cy.getBySel('sortable-table_check_select_all').click();
      cy.clickButton('Delete');
      cy.getBySel('prompt-remove-input')
        .type(clusterFull);
      cy.getBySel('prompt-remove-confirm-button').click();
      cy.contains('Active' + ' ' + clusterFull).should('not.exist', {timeout:30000});
      cy.checkCAPICluster(clusterShort);
    })
  );
  })
});

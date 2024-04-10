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

// In this file you can write your custom commands and overwrite existing commands.

import 'cypress-file-upload';
import * as cypressLib from '@rancher-ecp-qa/cypress-library';

// Generic commands
// Go to specific Sub Menu from Access Menu
Cypress.Commands.add('accesMenuSelection', (firstAccessMenu, secondAccessMenu) => {
  cypressLib.accesMenu(firstAccessMenu);
  cypressLib.accesMenu(secondAccessMenu);
});

// Command to set CAPI Auto-import on default namespace
Cypress.Commands.add('namespaceAutoImport', (mode) => {
  cy.contains('local')
    .click();
  cypressLib.accesMenu('Projects/Namespaces');
  cy.contains('Create Project')
    .should('be.visible');

  // Select default namespace
  cy.setNamespace('Project: Default');

  // Reload required since kebab menu icon not clickable
  cy.reload(true);
  cy.getBySel('sortable-table-0-action-button').click();


  // If the desired mode is already in place, then simply reload the page.
  cy.get('.list-unstyled.menu').then(($list) => {
    if ($list.text().includes(mode + ' CAPI Auto-Import')) {
      cy.contains(mode + ' CAPI Auto-Import').click();
    } else {
      // Workaround to close the dropdown menu
      cy.reload();
    }
  })
  cy.namespaceReset();
});

// Command to set namespace selection
// TOOD(pvala): Could be improved to check if the namespace is already set before changing it
Cypress.Commands.add('setNamespace', (namespace) => {
  cy.get('.ns-dropdown', { timeout: 12000 }).trigger('click');
  cy.get('.ns-clear').click();
  cy.get('.ns-filter-input').type(namespace + '{enter}{esc}');
});

// Command to reset namespace selection to default 'Only User Namespaces'
Cypress.Commands.add('namespaceReset', () => {
  cy.setNamespace('Only User Namespaces');
});

// Command to check CAPI cluster Active status
Cypress.Commands.add('checkCAPICluster', (clusterName) => {
  cypressLib.burgerMenuToggle();
  cy.accesMenuSelection('Cluster Management', 'CAPI');
  cy.contains('CAPI Clusters').click();
  cy.contains('Provisioned ' + clusterName, { timeout: 30000 });
  cy.contains('Machine Deployments').click();
  cy.contains('Running ' + clusterName, { timeout: 30000 });
  cy.contains('Machine Sets').click();
  cy.contains('Active ' + clusterName, { timeout: 30000 });
});

// Command to Install App from Charts menu
Cypress.Commands.add('installApp', (appName, namespace) => {
  cy.get('.nav').contains('Apps').click();
  cy.contains(appName, { timeout: 30000 }).click();
  cy.contains('Charts: ' + appName, { timeout: 30000 });
  cy.clickButton('Install');
  cy.contains('.outer-container > .header', appName);
  cy.clickButton('Next');
  cy.clickButton('Install');

  // Close the shell to avoid conflict
  cy.get('.closer', { timeout: 30000 }).click();

  // Select app namespace
  cy.setNamespace(namespace);

  // Resource should be deployed (green badge)
  cy.get('.outlet').contains('Deployed', { timeout: 180000 });
  cy.namespaceReset();
});

// Command to remove cluster
Cypress.Commands.add('deleteCluster', (clusterName) => {
  cy.visit('/');
  cy.clickButton('Manage');
  cy.contains('Active' + ' ' + clusterName);

  cy.viewport(1920, 1080);
  cy.get('.input-sm')
    .click()
    .type(clusterName);
  cy.getBySel('sortable-table_check_select_all').click();
  cy.clickButton('Delete');
  cy.getBySel('prompt-remove-input')
    .type(clusterName);
  cy.getBySel('prompt-remove-confirm-button').click();
  cy.contains('Active' + ' ' + clusterName).should('not.exist', { timeout: 30000 });
});

// Fleet commands
// Command add Fleet Git Repository
Cypress.Commands.add('addFleetGitRepo', ({ repoName, repoUrl, branch }) => {
  cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
  cy.contains('fleet-').click();
  cy.contains('fleet-local').should('be.visible').click();
  cy.clickButton('Add Repository');
  cy.contains('Git Repo:').should('be.visible');
  cy.typeValue('Name', repoName);
  cy.typeValue('Repository URL', repoUrl);
  cy.typeValue('Branch Name', branch);
  cy.clickButton('Next');
  cy.get('button.btn').contains('Previous').should('be.visible');
  cy.clickButton('Create');
})

// Command remove Fleet Git Repository
Cypress.Commands.add('removeFleetGitRepo', (repoName) => {
  // Go to 'Continuous Delivery' > 'Git Repos'
  cy.accesMenuSelection('Continuous Delivery', 'Git Repos');
  // Change the namespace to fleet-local using the dropdown on the top bar
  cy.contains('fleet-').click();
  cy.contains('fleet-local').should('be.visible').click();
  // Click the repo link
  cy.contains(repoName).click();
  cy.url().should("include", "fleet/fleet.cattle.io.gitrepo/fleet-local/clusters")
  // Click on the actions menu and select 'Delete' from the menu
  cy.get('.actions .btn.actions').click();
  cy.get('.icon.group-icon.icon-trash').click();
  cypressLib.confirmDelete();
})

Cypress.Commands.overwrite('type', (originalFn, subject, text, options = {}) => {
  options.delay = 100;
  return originalFn(subject, text, options);
});

// Add a delay between command without using cy.wait()
// https://github.com/cypress-io/cypress/issues/249#issuecomment-443021084
const COMMAND_DELAY = 1000;

for (const command of ['visit', 'click', 'trigger', 'type', 'clear', 'reload', 'contains']) {
  Cypress.Commands.overwrite(command, (originalFn, ...args) => {
    const origVal = originalFn(...args);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(origVal);
      }, COMMAND_DELAY);
    });
  });
};

